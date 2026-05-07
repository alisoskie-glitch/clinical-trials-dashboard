/**
 * Browser-side ClinicalTrials.gov v2 client.
 *
 * Mirrors the logic that previously lived in `server/clinical-trials-api.ts`
 * + `server/routes.ts` so the app can run as a static bundle (file-served
 * from a shared drive) without any backend.
 *
 * Docs: https://clinicaltrials.gov/data-api/api
 * CORS: confirmed (Access-Control-Allow-Origin: *)
 */
import type { Trial, TrialFilters, SearchResponse } from "@shared/schema";
import { assignSpecialty, type Specialty } from "@shared/specialty-taxonomy";
import {
  resolveCompany,
  suggestCompanies,
  PHARMA_COMPANIES,
} from "@shared/pharma-subsidiaries";

const API_BASE = "https://clinicaltrials.gov/api/v2/studies";

// React Query owns caching; this module just fetches + transforms.

// ---- Public API --------------------------------------------------------------

export interface CompanySuggestion {
  name: string;
  country?: string;
  subsidiaryCount: number;
}

export function getSuggestions(q: string, limit = 8): CompanySuggestion[] {
  return suggestCompanies(q, limit).map((c) => ({
    name: c.name,
    country: c.country,
    subsidiaryCount: c.searchNames.length,
  }));
}

export function getCuratedCompanies(): CompanySuggestion[] {
  return PHARMA_COMPANIES.map((c) => ({
    name: c.name,
    country: c.country,
    subsidiaryCount: c.searchNames.length,
  }));
}

export async function searchTrials(filters: TrialFilters): Promise<SearchResponse> {
  const company = resolveCompany(filters.company);
  if (!company.searchNames.length) {
    throw new Error("Company name is required");
  }

  const trials = await fetchTrials({
    sponsorNames: company.searchNames,
    phases: filters.phases,
    statuses: filters.statuses,
    windowMonths: filters.windowMonths,
    includeObservational: filters.includeObservational,
  });

  return {
    company: company.name,
    resolvedSearchNames: company.searchNames,
    trials,
    totalCount: trials.length,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };
}

// ---- Internal: paginated CT.gov fetch + transform ----------------------------

interface FetchParams {
  sponsorNames: string[];
  phases: string[];
  statuses: string[];
  windowMonths: number;
  includeObservational: boolean;
}

async function fetchTrials(params: FetchParams): Promise<Trial[]> {
  const { sponsorNames, phases, statuses, windowMonths, includeObservational } = params;
  if (sponsorNames.length === 0) return [];

  const today = new Date();
  const future = new Date(today);
  future.setMonth(future.getMonth() + windowMonths);
  const todayStr = today.toISOString().slice(0, 10);
  const futureStr = future.toISOString().slice(0, 10);

  const phaseClause = phases.length
    ? `AREA[Phase](${phases.join(" OR ")})`
    : null;
  const dateClause = `AREA[PrimaryCompletionDate]RANGE[${todayStr},${futureStr}]`;
  const studyTypeFilter = includeObservational ? null : "AREA[StudyType]INTERVENTIONAL";

  const advanced = [phaseClause, dateClause, studyTypeFilter].filter(Boolean).join(" AND ");

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
        // eslint-disable-next-line no-console
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
  const MAX_PAGES = 10; // 10 pages × 100 = 1000 trials max per sponsor

  while (pageCount < MAX_PAGES) {
    const params = new URLSearchParams({
      "query.lead": `"${sponsorName}"`,
      "filter.overallStatus": statuses.join(","),
      "filter.advanced": advancedFilter,
      pageSize: "100",
      format: "json",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const url = `${API_BASE}?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `ClinicalTrials.gov API error ${res.status}: ${errText.slice(0, 200)}`,
      );
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
 * Transform a raw ClinicalTrials.gov v2 study into our normalized Trial shape.
 * Identical to the previous server-side transform.
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
  let phaseDisplay = phases.join("/");
  if (phases.length === 1) phaseDisplay = phases[0];

  const collaborators: string[] = (sponsorMod.collaborators ?? [])
    .map((c: any) => c.name)
    .filter(Boolean);

  const interventions: any[] = armsInt.interventions ?? [];
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
