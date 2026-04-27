import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { fetchTrials } from "./clinical-trials-api";
import { resolveCompany, suggestCompanies, PHARMA_COMPANIES } from "@shared/pharma-subsidiaries";
import { trialFiltersSchema, type SearchResponse } from "@shared/schema";

// Simple in-memory cache: key = `${companyName}|${filterHash}` -> { data, timestamp }
const CACHE = new Map<string, { data: SearchResponse; timestamp: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function cacheKey(filters: any): string {
  return JSON.stringify({
    company: filters.company.toLowerCase().trim(),
    phases: [...filters.phases].sort(),
    statuses: [...filters.statuses].sort(),
    windowMonths: filters.windowMonths,
    includeObservational: filters.includeObservational,
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Autocomplete suggestions for the search input
  app.get("/api/suggest", (req, res) => {
    const q = (req.query.q as string) ?? "";
    const matches = suggestCompanies(q, 8).map((c) => ({
      name: c.name,
      country: c.country,
      subsidiaryCount: c.searchNames.length,
    }));
    res.json({ matches });
  });

  // Curated companies list (for landing page)
  app.get("/api/companies", (_req, res) => {
    res.json({
      companies: PHARMA_COMPANIES.map((c) => ({
        name: c.name,
        country: c.country,
        subsidiaryCount: c.searchNames.length,
      })),
    });
  });

  // Main search endpoint
  app.post("/api/search", async (req, res) => {
    const parsed = trialFiltersSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid filters", details: parsed.error.flatten() });
    }

    const filters = parsed.data;
    const force = req.query.force === "true";
    const key = cacheKey(filters);

    // Cache lookup
    if (!force) {
      const cached = CACHE.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return res.json({ ...cached.data, cached: true });
      }
    }

    const company = resolveCompany(filters.company);
    if (!company.searchNames.length) {
      return res.status(400).json({ error: "Company name is required" });
    }

    try {
      const trials = await fetchTrials({
        sponsorNames: company.searchNames,
        phases: filters.phases,
        statuses: filters.statuses,
        windowMonths: filters.windowMonths,
        includeObservational: filters.includeObservational,
      });

      const response: SearchResponse = {
        company: company.name,
        resolvedSearchNames: company.searchNames,
        trials,
        totalCount: trials.length,
        fetchedAt: new Date().toISOString(),
        cached: false,
      };

      CACHE.set(key, { data: response, timestamp: Date.now() });
      return res.json(response);
    } catch (err: any) {
      console.error("[/api/search] error:", err);
      return res.status(502).json({
        error: "Failed to fetch trials from ClinicalTrials.gov",
        message: err?.message ?? "Unknown error",
      });
    }
  });

  return httpServer;
}
