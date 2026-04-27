import { z } from "zod";
import type { Specialty } from "./specialty-taxonomy";

/**
 * Normalized trial record returned to the frontend.
 * This is the shape used by the dashboard table, charts, and exports.
 */
export const trialSchema = z.object({
  nctId: z.string(),
  briefTitle: z.string(),
  acronym: z.string().optional(),
  briefSummary: z.string().optional(),
  phase: z.string(), // "PHASE2", "PHASE3", "PHASE2/PHASE3"
  overallStatus: z.string(),
  studyType: z.string().optional(),
  // Sponsorship
  leadSponsor: z.string(),
  collaborators: z.array(z.string()).default([]),
  // Drugs / interventions
  drugNames: z.array(z.string()).default([]),
  allInterventions: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
      }),
    )
    .default([]),
  // Conditions / specialty
  conditions: z.array(z.string()).default([]),
  specialty: z.string(), // Specialty
  meshBranches: z.array(z.string()).default([]),
  // Endpoints
  primaryEndpoints: z.array(z.string()).default([]),
  secondaryEndpoints: z.array(z.string()).default([]),
  // Dates (ISO YYYY-MM or YYYY-MM-DD)
  startDate: z.string().optional(),
  primaryCompletionDate: z.string().optional(),
  primaryCompletionDateType: z.string().optional(), // ACTUAL or ESTIMATED
  completionDate: z.string().optional(),
  lastUpdatePostDate: z.string().optional(),
  // Enrollment
  enrollmentCount: z.number().optional(),
  // Status / notes
  whyStopped: z.string().optional(),
  recentlyUpdated: z.boolean().default(false), // last update within 60 days
  // External
  url: z.string(),
});

export type Trial = z.infer<typeof trialSchema>;

/**
 * Filters applied client- or server-side
 */
export const trialFiltersSchema = z.object({
  company: z.string(),
  phases: z.array(z.string()).default(["PHASE2", "PHASE3"]),
  statuses: z
    .array(z.string())
    .default([
      "RECRUITING",
      "ACTIVE_NOT_RECRUITING",
      "ENROLLING_BY_INVITATION",
      "NOT_YET_RECRUITING",
    ]),
  windowMonths: z.number().default(24),
  includeObservational: z.boolean().default(false),
  specialties: z.array(z.string()).optional(),
});

export type TrialFilters = z.infer<typeof trialFiltersSchema>;

/**
 * Search response payload returned by /api/search
 */
export const searchResponseSchema = z.object({
  company: z.string(),
  resolvedSearchNames: z.array(z.string()),
  trials: z.array(trialSchema),
  totalCount: z.number(),
  fetchedAt: z.string(), // ISO timestamp
  cached: z.boolean(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;
