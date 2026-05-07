import { useState, useMemo } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search as SearchIcon,
  Download,
  FileSpreadsheet,
  FileText,
  Share2,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
  LineChart,
} from "lucide-react";
import type { Trial, SearchResponse, TrialFilters } from "@shared/schema";
import { SPECIALTIES, SPECIALTY_COLORS, type Specialty } from "@shared/specialty-taxonomy";
import { searchTrials } from "@/lib/clinical-trials-client";
import { LogoWordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SpecialtyChart } from "@/components/SpecialtyChart";
import { GanttChart } from "@/components/GanttChart";
import { TrialDetailDrawer } from "@/components/TrialDetailDrawer";
import { TrialTimelineModal } from "@/components/TrialTimelineModal";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exports";
import { formatDate, formatPhase, formatStatus, daysSince } from "@/lib/format";

const PHASE_OPTIONS = [
  { value: "PHASE2", label: "Phase 2" },
  { value: "PHASE3", label: "Phase 3" },
  { value: "PHASE1", label: "Phase 1" },
  { value: "PHASE4", label: "Phase 4" },
];

const STATUS_OPTIONS = [
  { value: "RECRUITING", label: "Recruiting" },
  { value: "ACTIVE_NOT_RECRUITING", label: "Active, not recruiting" },
  { value: "ENROLLING_BY_INVITATION", label: "Enrolling by invitation" },
  { value: "NOT_YET_RECRUITING", label: "Not yet recruiting" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "COMPLETED", label: "Completed" },
];

const WINDOW_OPTIONS = [
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
  { value: 18, label: "18 months" },
  { value: 24, label: "24 months" },
  { value: 36, label: "36 months" },
];

export default function Dashboard() {
  const [, params] = useRoute("/dashboard/:company");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const companyParam = params?.company ? decodeURIComponent(params.company) : "";

  // Filter state — also encoded in the URL via hash query string, but stored in component state
  const initialFilters = useMemo(() => parseUrlFilters(), []);
  const [phases, setPhases] = useState<string[]>(initialFilters.phases);
  const [statuses, setStatuses] = useState<string[]>(initialFilters.statuses);
  const [windowMonths, setWindowMonths] = useState<number>(initialFilters.windowMonths);
  const [includeObservational, setIncludeObservational] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    initialFilters.specialty,
  );
  const [openSpecialties, setOpenSpecialties] = useState<Set<string>>(new Set(SPECIALTIES));
  const [drawerTrial, setDrawerTrial] = useState<Trial | null>(null);
  const [timelineTrial, setTimelineTrial] = useState<Trial | null>(null);

  // Build filters object for API
  const filters: TrialFilters = {
    company: companyParam,
    phases,
    statuses,
    windowMonths,
    includeObservational,
  };

  // Fetch trials directly from ClinicalTrials.gov v2 (browser-side)
  const { data, isLoading, isFetching, error, refetch } = useQuery<SearchResponse>({
    queryKey: ["search", JSON.stringify(filters)],
    queryFn: () => searchTrials(filters),
    enabled: !!companyParam,
    staleTime: 5 * 60 * 1000,
  });

  // Apply specialty filter
  const filteredTrials = useMemo(() => {
    if (!data?.trials) return [];
    if (!selectedSpecialty) return data.trials;
    return data.trials.filter((t) => t.specialty === selectedSpecialty);
  }, [data?.trials, selectedSpecialty]);

  // Group trials by specialty (sorted desc by count, alphabetical inside)
  const groupedBySpecialty = useMemo(() => {
    const map = new Map<string, Trial[]>();
    for (const t of filteredTrials) {
      if (!map.has(t.specialty)) map.set(t.specialty, []);
      map.get(t.specialty)!.push(t);
    }
    // Sort each specialty's trials by primary completion date asc
    for (const arr of map.values()) {
      arr.sort((a, b) =>
        (a.primaryCompletionDate ?? "9999").localeCompare(b.primaryCompletionDate ?? "9999"),
      );
    }
    // Sort specialties by count desc
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filteredTrials]);

  // Phase counts for header
  const phaseCounts = useMemo(() => {
    const c = { p2: 0, p3: 0, other: 0 };
    for (const t of data?.trials ?? []) {
      if (t.phase.includes("PHASE3")) c.p3++;
      else if (t.phase.includes("PHASE2")) c.p2++;
      else c.other++;
    }
    return c;
  }, [data?.trials]);

  const togglePhase = (p: string) => {
    setPhases((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const toggleStatus = (s: string) => {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const toggleSpecialtySection = (s: string) => {
    setOpenSpecialties((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const onShare = async () => {
    const url = new URL(window.location.href);
    // Encode filter state in hash query for shareable links
    const filterParams = new URLSearchParams();
    filterParams.set("phases", phases.join(","));
    filterParams.set("window", String(windowMonths));
    if (selectedSpecialty) filterParams.set("specialty", selectedSpecialty);
    const shareUrl = `${url.origin}${url.pathname}#/dashboard/${encodeURIComponent(companyParam)}?${filterParams.toString()}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied", description: "Share with colleagues to open this view" });
    } catch {
      toast({ title: "Share link", description: shareUrl });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" data-testid="link-home">
              <LogoWordmark className="shrink-0" />
            </Link>
            <span className="text-muted-foreground hidden sm:inline">/</span>
            <span className="text-sm font-medium truncate" data-testid="text-company-name">
              {companyParam}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              data-testid="button-new-search"
            >
              <SearchIcon className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New search</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Title block */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2">
            <Link href="/" data-testid="link-back">
              <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3 w-3" />
                Back to search
              </button>
            </Link>
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">
              {companyParam} Pipeline
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {data && (
                <>
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground nums" data-testid="text-trial-count">
                      {data.totalCount}
                    </span>{" "}
                    {data.totalCount === 1 ? "trial" : "trials"} completing through{" "}
                    {formatDate(
                      new Date(Date.now() + windowMonths * 30 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .slice(0, 7),
                    )}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm nums">
                    <span className="text-primary font-medium">P3 {phaseCounts.p3}</span>
                    <span className="text-muted-foreground mx-1.5">/</span>
                    <span className="text-foreground/80">P2 {phaseCounts.p2}</span>
                  </span>
                </>
              )}
              {data?.cached && (
                <Badge variant="outline" className="text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Cached
                </Badge>
              )}
            </div>

            {/* Subsidiary pills */}
            {data && data.resolvedSearchNames.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium mr-1">
                  Search includes:
                </span>
                {data.resolvedSearchNames.slice(0, 8).map((n) => (
                  <Badge key={n} variant="secondary" className="text-xs font-normal">
                    {n}
                  </Badge>
                ))}
                {data.resolvedSearchNames.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.resolvedSearchNames.length - 8} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              data-testid="button-share"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" data-testid="button-export">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => data && exportCsv(filteredTrials, data.company)}
                  data-testid="button-export-csv"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => data && exportExcel(filteredTrials, data.company)}
                  data-testid="button-export-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => data && exportPdf(filteredTrials, data.company)}
                  data-testid="button-export-pdf"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF report (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters bar */}
        <Card className="p-3 flex flex-wrap items-center gap-2 bg-card">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium ml-1 mr-1 inline-flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Filters
          </span>

          {/* Phases */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-filter-phase">
                Phase: <span className="ml-1 font-medium">{phases.length === PHASE_OPTIONS.length ? "All" : phases.map((p) => p.replace("PHASE", "P")).join(", ")}</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Trial Phase</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PHASE_OPTIONS.map((p) => (
                <DropdownMenuCheckboxItem
                  key={p.value}
                  checked={phases.includes(p.value)}
                  onCheckedChange={() => togglePhase(p.value)}
                >
                  {p.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-filter-status">
                Status: <span className="ml-1 font-medium">{statuses.length === STATUS_OPTIONS.length ? "All" : `${statuses.length} selected`}</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Trial Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s.value}
                  checked={statuses.includes(s.value)}
                  onCheckedChange={() => toggleStatus(s.value)}
                >
                  {s.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Window */}
          <Select
            value={String(windowMonths)}
            onValueChange={(v) => setWindowMonths(Number(v))}
          >
            <SelectTrigger className="h-9 w-auto" data-testid="select-window">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOW_OPTIONS.map((w) => (
                <SelectItem key={w.value} value={String(w.value)}>
                  Next {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Specialty filter (set from chart click) */}
          {selectedSpecialty && (
            <Badge
              variant="default"
              className="gap-1.5 text-xs cursor-pointer"
              onClick={() => setSelectedSpecialty(null)}
              data-testid="badge-active-specialty"
            >
              {selectedSpecialty}
              <span className="text-base leading-none">×</span>
            </Badge>
          )}
        </Card>

        {/* Loading / error states */}
        {isLoading && <DashboardSkeleton />}

        {error && !isLoading && (
          <Card className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1">Couldn't load trials</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {(error as any)?.message ?? "An error occurred while contacting ClinicalTrials.gov."}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Try again
            </Button>
          </Card>
        )}

        {/* Empty state */}
        {data && !isLoading && data.totalCount === 0 && (
          <Card className="p-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1">No trials found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              No trials match your filters for {companyParam}. Try widening the time window, adding more
              phases, or including additional statuses.
            </p>
          </Card>
        )}

        {/* Visualizations */}
        {data && !isLoading && data.totalCount > 0 && (
          <>
            <div className="space-y-4">
              {/* Specialty breakdown */}
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold">Specialty Breakdown</h2>
                    <p className="text-xs text-muted-foreground">Click a row to filter</p>
                  </div>
                  <span className="text-xs text-muted-foreground">P3 / P2 stacked</span>
                </div>
                <SpecialtyChart
                  trials={data.trials}
                  selectedSpecialty={selectedSpecialty}
                  onSelectSpecialty={setSelectedSpecialty}
                />
              </Card>

              {/* Gantt timeline */}
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold">Completion Timeline</h2>
                    <p className="text-xs text-muted-foreground">Each bar is one trial · Click for details</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Next {windowMonths}mo</span>
                </div>
                <GanttChart
                  trials={filteredTrials}
                  windowMonths={windowMonths}
                  onSelectTrial={setDrawerTrial}
                />
              </Card>
            </div>

            {/* Specialty sections */}
            <div className="space-y-4">
              {groupedBySpecialty.map(([specialty, trials]) => {
                const isOpen = openSpecialties.has(specialty);
                const color = SPECIALTY_COLORS[specialty as Specialty] ?? "hsl(220 5% 50%)";
                return (
                  <Card key={specialty} className="overflow-hidden">
                    <button
                      onClick={() => toggleSpecialtySection(specialty)}
                      className="w-full flex items-center justify-between px-4 sm:px-5 py-3 border-b border-card-border hover-elevate"
                      data-testid={`section-toggle-${specialty.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <h3 className="text-sm font-semibold">{specialty}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {trials.length}
                        </Badge>
                      </div>
                    </button>
                    {isOpen && (
                      <TrialTable
                        trials={trials}
                        onSelect={setDrawerTrial}
                        onTimeline={setTimelineTrial}
                      />
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Footer status */}
      {data && (
        <footer className="border-t border-border bg-card px-4 sm:px-6 py-2.5">
          <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Data refreshed{" "}
              {new Date(data.fetchedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
            <div className="flex items-center gap-1">
              Source:{" "}
              <a
                href="https://clinicaltrials.gov"
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-primary"
              >
                ClinicalTrials.gov v2 API
              </a>
            </div>
          </div>
        </footer>
      )}

      <TrialDetailDrawer
        trial={drawerTrial}
        open={!!drawerTrial}
        onClose={() => setDrawerTrial(null)}
      />

      <TrialTimelineModal
        trial={timelineTrial}
        open={!!timelineTrial}
        onClose={() => setTimelineTrial(null)}
      />
    </div>
  );
}

function TrialTable({
  trials,
  onSelect,
  onTimeline,
}: {
  trials: Trial[];
  onSelect: (t: Trial) => void;
  onTimeline: (t: Trial) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-muted-foreground">
          <tr className="text-left">
            <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wider w-[120px]">
              
            </th>
            <th className="px-4 py-2.5 font-medium text-xs uppercase tracking-wider min-w-[280px]">
              Trial
            </th>
            <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wider">
              Phase
            </th>
            <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wider min-w-[160px]">
              Drug(s)
            </th>
            <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wider min-w-[140px]">
              Conditions
            </th>
            <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
              Completion
            </th>
            <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wider min-w-[140px]">
              Sponsor
            </th>
            <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
              Update
            </th>
            <th className="px-3 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {trials.map((t) => (
            <tr
              key={t.nctId}
              className="border-t border-card-border hover:bg-secondary/40 cursor-pointer transition-colors"
              onClick={() => onSelect(t)}
              data-testid={`row-trial-${t.nctId}`}
            >
              <td className="px-3 py-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTimeline(t);
                  }}
                  data-testid={`button-timeline-${t.nctId}`}
                  title="Open qualitative MR engagement timeline"
                >
                  <LineChart className="h-3.5 w-3.5" />
                  Timeline
                </Button>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium leading-snug max-w-2xl">
                  {t.briefTitle}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {t.acronym && (
                    <span className="text-xs font-medium text-primary">{t.acronym}</span>
                  )}
                  <span className="text-xs text-muted-foreground font-mono">{t.nctId}</span>
                  <Badge variant="outline" className="text-[10px] py-0 h-4">
                    {formatStatus(t.overallStatus)}
                  </Badge>
                </div>
              </td>
              <td className="px-3 py-3">
                <Badge variant="secondary" className="font-medium">
                  {formatPhase(t.phase)}
                </Badge>
              </td>
              <td className="px-3 py-3 text-foreground/90">
                {t.drugNames.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <div className="space-y-0.5">
                    {t.drugNames.slice(0, 2).map((d, i) => (
                      <div key={`${t.nctId}-drug-${i}`} className="truncate max-w-[200px]" title={d}>
                        {d}
                      </div>
                    ))}
                    {t.drugNames.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{t.drugNames.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-3 py-3 text-xs text-foreground/80">
                {t.conditions.slice(0, 2).map((c, i) => (
                  <div key={i} className="truncate max-w-[180px]" title={c}>
                    {c}
                  </div>
                ))}
                {t.conditions.length > 2 && (
                  <div className="text-muted-foreground">+{t.conditions.length - 2}</div>
                )}
              </td>
              <td className="px-3 py-3 nums whitespace-nowrap">
                {formatDate(t.primaryCompletionDate)}
                {t.primaryCompletionDateType === "ESTIMATED" && (
                  <div className="text-[10px] text-muted-foreground">est.</div>
                )}
              </td>
              <td className="px-3 py-3 text-xs">
                <div className="font-medium truncate max-w-[180px]" title={t.leadSponsor}>
                  {t.leadSponsor}
                </div>
                {t.collaborators.length > 0 && (
                  <div className="text-muted-foreground truncate max-w-[180px]">
                    + {t.collaborators.length} collab
                  </div>
                )}
              </td>
              <td className="px-3 py-3">
                {t.recentlyUpdated ? (
                  <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30 hover:bg-primary/15 gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {daysSince(t.lastUpdatePostDate)}d
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground nums">
                    {daysSince(t.lastUpdatePostDate) ?? "—"}d
                  </span>
                )}
              </td>
              <td className="px-3 py-3 text-right">
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                  data-testid={`link-external-${t.nctId}`}
                  title="Open on ClinicalTrials.gov"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-5 w-40 mb-3" />
          <div className="space-y-2">
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ))}
      <div className="text-center text-sm text-muted-foreground pt-4 flex items-center justify-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Searching ClinicalTrials.gov for trials across sponsors and subsidiaries…
      </div>
    </div>
  );
}

/**
 * Parse filter state from the URL hash query string.
 * Format: /#/dashboard/<company>?phases=PHASE2,PHASE3&window=24&specialty=Oncology
 */
function parseUrlFilters() {
  const defaults = {
    phases: ["PHASE2", "PHASE3"],
    statuses: [
      "RECRUITING",
      "ACTIVE_NOT_RECRUITING",
      "ENROLLING_BY_INVITATION",
      "NOT_YET_RECRUITING",
    ],
    windowMonths: 24,
    specialty: null as string | null,
  };
  if (typeof window === "undefined") return defaults;
  const hash = window.location.hash;
  const queryIdx = hash.indexOf("?");
  if (queryIdx === -1) return defaults;
  const search = new URLSearchParams(hash.slice(queryIdx + 1));
  const phasesParam = search.get("phases");
  const windowParam = search.get("window");
  const specialtyParam = search.get("specialty");
  return {
    phases: phasesParam ? phasesParam.split(",").filter(Boolean) : defaults.phases,
    statuses: defaults.statuses,
    windowMonths: windowParam ? Number(windowParam) || 24 : 24,
    specialty: specialtyParam || null,
  };
}
