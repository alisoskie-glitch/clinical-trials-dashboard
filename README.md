# Trialscope

The 24-month pipeline view for any pharma company.

Trialscope searches [ClinicalTrials.gov](https://clinicaltrials.gov) and produces a clean, sortable dashboard of every Phase 2 and Phase 3 trial for a sponsor (and its subsidiaries and frequent collaborators) due to complete in the next two years.

**Live demo:** [trialscope.pplx.app](https://trialscope.pplx.app)

## Features

- **Smart sponsor expansion** — search "Roche" and the dashboard automatically includes Genentech, Chugai, Spark Therapeutics, Foundation Medicine, and Flatiron Health. 100+ pharma firms mapped.
- **Specialty-grouped Gantt timeline** — colored by therapeutic area, sorted chronologically by primary completion date.
- **Specialty Breakdown chart** — clickable rows filter the table.
- **Trial detail drawer** — NCT ID, codename (e.g. POLARIX), brief summary, key dates, enrollment, interventions, sponsor, collaborators.
- **Filters** — phase (P1–P4), status, completion window (6/12/18/24/36 months). All visualizations update reactively.
- **Exports** — CSV, Excel (.xlsx), PDF report.
- **Shareable links** — URLs encode the active filter state.
- **Dark mode** + mobile-responsive layout.
- **6-hour cache** for ClinicalTrials.gov API responses.

## Stack

- **Frontend:** React + TypeScript, Vite, Tailwind CSS v3, shadcn/ui, TanStack Query, wouter
- **Backend:** Express, Node.js, in-memory cache
- **Data source:** [ClinicalTrials.gov v2 API](https://clinicaltrials.gov/data-api/api) (no auth required)
- **Charts:** Recharts (specialty breakdown), custom SVG (Gantt)
- **Exports:** `xlsx`, `jspdf`, `html2canvas`

## Getting started

```bash
git clone https://github.com/<your-username>/clinical-trials-dashboard.git
cd clinical-trials-dashboard
npm install
npm run dev
```

The app runs on [http://localhost:5000](http://localhost:5000).

## Build

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## Project structure

```
client/             # React frontend
  src/
    pages/          # home.tsx, dashboard.tsx
    components/     # GanttChart, SpecialtyChart, TrialDetailDrawer, ui/
    lib/            # queryClient, exports (CSV/Excel/PDF)
server/             # Express backend
  routes.ts         # /api/suggest, /api/companies, POST /api/search
  clinical-trials-api.ts  # ClinicalTrials.gov proxy + caching
shared/             # Shared between client and server
  schema.ts         # Zod schemas + types
  pharma-subsidiaries.ts  # 100+ pharma firms with their subsidiaries
  specialty-taxonomy.ts   # Condition → specialty mapping
```

## API

- `GET /api/suggest?q=<query>` — autocomplete pharma names
- `GET /api/companies` — list all featured pharma firms
- `POST /api/search` — body: `{ company, phases, statuses, windowMonths }` → returns trials grouped by specialty

## License

MIT
