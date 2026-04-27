/**
 * ClinicalTrials.gov v2 API client.
 * Docs: https://clinicaltrials.gov/data-api/api
 */
import type { Trial } from "@shared/schema";
import { assignSpecialty, type Specialty } from "@shared/specialty-taxonomy";

const API_BASE = "https://clinicaltrials.gov/api/v2/studies";

export interface SearchParams {
  sponsorNames: string[];
  phases: string[]; // e.g. ["PHASE2", "PHASE3"]
  statuses: string[];
  windowMonths: number;
  includeObservational: boolean;
}

/**
 * Fetch trials from ClinicalTrials.gov for the given sponsor names and filters.
 * Issues one query per sponsor name in parallel, deduplicates by NCT ID.
 */
export async function fetchTrials(params: SearchParams): Promise<Trial[]> {
  const { sponsorNames, phases, statuses, windowMonths, includeObservational } = params;
  if (sponsorNames.length === 0) return [];

  const today = new Date();
  const future = new Date(today);
  future.setMonth(future.getMonth() + windowMonths);
  const todayStr = today.toISOString().slice(0, 10);
  const futureStr = future.toISOString().slice(0, 10);

  // Phase filter — API expects an OR via the AREA syntax in filter.advanced
  const phaseClause = phases.length
    ? `AREA[Phase](${phases.join(" OR ")})`
    : null;

  // Date window: PrimaryCompletionDate between today and today + windowMonths
  const dateClause = `AREA[PrimaryCompletionDate]RANGE[${todayStr},${futureStr}]`;

  const advancedClauses = [phaseClause, dateClause].filter(Boolean).join(" AND ");

  const studyTypeFilter = includeObservational
    ? null
    : "AREA[StudyType]INTERVENTIONAL";

  const advanced = studyTypeFilter
    ? `${advancedClauses} AND ${studyTypeFilter}`
    : advancedClauses;

  // Query each sponsor in parallel
  const allTrials: Trial[] = [];
  const seenNctIds = new Set<string>();

  await Promise.all(
    sponsorNames.map(async (sponsor) => {
      try {
        const trials = await fetchForSponsor(sponsor, advanced, statuses);
        for (const trial of trials) {
          if (!seenNctIds.has(trial.nctId)) {
            seenNctIds.add(trial.nctId);
            allTrials.push(trial);
          }
        }
      } catch (err) {
        console.error(`[ClinicalTrials] Failed to fetch for sponsor "${sponsor}":`, err);
      }
    }),
  );

  return allTrials;
}

async function fetchForSponsor(
  sponsorName: string,
  advancedFilter: string,
  statuses: string[],
): Promise<Trial[]> {
  const trials: Trial[] = [];
  let pageToken: string | undefined = undefined;
  let pageCount = 0;
  const MAX_PAGES = 10; // safety cap (10 pages × 100 per page = 1000 trials max per sponsor)

  while (pageCount < MAX_PAGES) {
    const params = new URLSearchParams({
      "query.lead": `"${sponsorName}"`, // searches lead sponsor + collaborators
      "filter.overallStatus": statuses.join(","),
      "filter.advanced": advancedFilter,
      pageSize: "100",
      format: "json",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const url = `${API_BASE}?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ClinicalTrials.gov API error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const studies: any[] = data.studies ?? [];
    for (const study of studies) {
      const trial = transformStudy(study);
      if (trial) trials.push(trial);
    }

    pageToken = data.nextPageToken;
    pageCount++;
    if (!pageToken) break;
  }

  return trials;
}

/**
 * Transform a raw ClinicalTrials.gov v2 study object into our normalized Trial shape.
 */
function transformStudy(study: any): Trial | null {
  const proto = study?.protocolSection;
  if (!proto) return null;

  const id = proto.identificationModule ?? {};
  const status = proto.statusModule ?? {};
  const sponsorMod = proto.sponsorCollaboratorsModule ?? {};
  const desc = proto.descriptionModule ?? {};
  const cond = proto.conditionsModule ?? {};
  const design = proto.designModule ?? {};
  const armsInt = proto.armsInterventionsModule ?? {};
  const outcomes = proto.outcomesModule ?? {};
  const derivedCond = study?.derivedSection?.conditionBrowseModule ?? {};

  const nctId = id.nctId;
  if (!nctId) return null;

  const phases: string[] = design.phases ?? [];
  // Normalize "PHASE2 + PHASE3" into "PHASE2/PHASE3" for display purposes
  let phaseDisplay = phases.join("/");
  if (phases.length === 1) phaseDisplay = phases[0];

  const collaborators: string[] = (sponsorMod.collaborators ?? [])
    .map((c: any) => c.name)
    .filter(Boolean);

  const interventions: any[] = armsInt.interventions ?? [];
  // Deduplicate interventions by name+type (some trials list the same intervention in multiple arms)
  const seenIntervention = new Set<string>();
  const allInterventions = interventions
    .map((i) => ({ name: i.name ?? "", type: i.type ?? "" }))
    .filter((i) => {
      const k = `${i.name}§${i.type}`;
      if (seenIntervention.has(k)) return false;
      seenIntervention.add(k);
      return true;
    });
  const drugNamesRaw = allInterventions
    .filter(
      (i) =>
        i.type?.toUpperCase() === "DRUG" ||
        i.type?.toUpperCase() === "BIOLOGICAL" ||
        i.type?.toUpperCase() === "COMBINATION_PRODUCT",
    )
    .map((i) => i.name)
    .filter(Boolean);
  // Deduplicate drug names (some trials list the same drug across multiple arms)
  const drugNames = Array.from(new Set(drugNamesRaw));

  const conditions: string[] = cond.conditions ?? [];
  const browseBranches: string[] = (derivedCond.browseBranches ?? [])
    .map((b: any) => b.abbrev)
    .filter(Boolean);

  const specialty: Specialty = assignSpecialty(conditions, browseBranches);

  const primaryCompletion = status.primaryCompletionDateStruct ?? {};
  const completion = status.completionDateStruct ?? {};
  const startDate = status.startDateStruct?.date;
  const lastUpdate = status.lastUpdatePostDateStruct?.date;

  // Recently updated: within the last 60 days
  let recentlyUpdated = false;
  if (lastUpdate) {
    const updateMs = parseDateToMs(lastUpdate);
    if (updateMs && Date.now() - updateMs < 60 * 24 * 60 * 60 * 1000) {
      recentlyUpdated = true;
    }
  }

  const primaryEndpoints: string[] = (outcomes.primaryOutcomes ?? [])
    .map((o: any) => o.measure)
    .filter(Boolean);
  const secondaryEndpoints: string[] = (outcomes.secondaryOutcomes ?? [])
    .map((o: any) => o.measure)
    .filter(Boolean);

  return {
    nctId,
    briefTitle: id.briefTitle ?? "",
    acronym: id.acronym,
    briefSummary: desc.briefSummary,
    phase: phaseDisplay || "NA",
    overallStatus: status.overallStatus ?? "",
    studyType: design.studyType,
    leadSponsor: sponsorMod.leadSponsor?.name ?? "",
    collaborators,
    drugNames,
    allInterventions,
    conditions,
    specialty,
    meshBranches: browseBranches,
    primaryEndpoints,
    secondaryEndpoints,
    startDate,
    primaryCompletionDate: primaryCompletion.date,
    primaryCompletionDateType: primaryCompletion.type,
    completionDate: completion.date,
    lastUpdatePostDate: lastUpdate,
    enrollmentCount: design.enrollmentInfo?.count,
    whyStopped: status.whyStopped,
    recentlyUpdated,
    url: `https://clinicaltrials.gov/study/${nctId}`,
  };
}

/**
 * Parse mixed date formats: "YYYY", "YYYY-MM", "YYYY-MM-DD" -> ms timestamp.
 */
function parseDateToMs(date: string): number | null {
  if (!date) return null;
  const parts = date.split("-");
  let iso: string;
  if (parts.length === 1) iso = `${date}-01-01`;
  else if (parts.length === 2) iso = `${date}-01`;
  else iso = date;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.getTime();
}
