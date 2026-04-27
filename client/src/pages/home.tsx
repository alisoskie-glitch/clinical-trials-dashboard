import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight, Building2, Calendar, TrendingUp, FileSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoWordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiRequest } from "@/lib/queryClient";

interface CompanySuggestion {
  name: string;
  country?: string;
  subsidiaryCount: number;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestData } = useQuery<{ matches: CompanySuggestion[] }>({
    queryKey: ["/api/suggest", query],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/suggest?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: query.trim().length >= 1,
  });

  const { data: companiesData } = useQuery<{ companies: CompanySuggestion[] }>({
    queryKey: ["/api/companies"],
  });

  const suggestions = suggestData?.matches ?? [];
  const featuredCompanies = (companiesData?.companies ?? []).slice(0, 12);

  // Click outside to close suggestions
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (companyName: string) => {
    const trimmed = companyName.trim();
    if (!trimmed) return;
    navigate(`/dashboard/${encodeURIComponent(trimmed)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        submit(suggestions[activeIndex].name);
      } else {
        submit(query);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <LogoWordmark />
          <div className="flex items-center gap-2">
            <a
              href="https://clinicaltrials.gov"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              data-testid="link-data-source"
            >
              Powered by ClinicalTrials.gov
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero / Search */}
      <main className="flex-1 flex flex-col">
        <section className="px-6 pt-16 pb-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live data from ClinicalTrials.gov
            </div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight mb-4 text-balance">
              The 24-month pipeline view for any pharma company
            </h1>
            <p className="text-base text-muted-foreground mb-10 max-w-xl mx-auto">
              Search a pharmaceutical or biotech company and instantly see all Phase 2 and Phase 3 trials completing in
              the next two years — sorted by specialty, ready to export.
            </p>

            {/* Search */}
            <div ref={containerRef} className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                    setActiveIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={onKeyDown}
                  placeholder="Search a pharma company — e.g., Roche, Pfizer, Moderna"
                  className="pl-11 pr-32 h-14 text-base shadow-sm"
                  data-testid="input-company-search"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button
                    className="h-10 px-4 whitespace-nowrap"
                    onClick={() => submit(query)}
                    disabled={!query.trim()}
                    data-testid="button-search"
                  >
                    <span>Search</span>
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <Card
                  className="absolute z-10 mt-2 w-full overflow-hidden text-left shadow-md"
                  data-testid="suggestions-dropdown"
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={s.name}
                      onClick={() => submit(s.name)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between border-b border-card-border last:border-b-0 transition-colors ${
                        i === activeIndex ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                      data-testid={`suggestion-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{s.name}</span>
                        {s.country && (
                          <span className="text-xs text-muted-foreground">{s.country}</span>
                        )}
                      </div>
                      {s.subsidiaryCount > 1 && (
                        <span className="text-xs text-muted-foreground">
                          +{s.subsidiaryCount - 1} subsidiaries
                        </span>
                      )}
                    </button>
                  ))}
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Featured companies */}
        <section className="px-6 pb-12">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Quick start
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {featuredCompanies.map((c) => (
                <button
                  key={c.name}
                  onClick={() => submit(c.name)}
                  className="text-left px-3 py-2.5 rounded-md border border-card-border bg-card hover-elevate transition-colors"
                  data-testid={`featured-${c.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.country ?? "—"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Feature row */}
        <section className="px-6 py-16 bg-secondary/40 border-t border-border">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Building2 className="h-5 w-5" />}
              title="Sponsor + subsidiaries + collaborators"
              body="Search Roche and we'll include Genentech, Chugai, Foundation Medicine, and every active collaboration — no manual roll-up."
            />
            <FeatureCard
              icon={<Calendar className="h-5 w-5" />}
              title="24-month readout window"
              body="Filter to trials completing in the next two years by default. Adjust to 6, 12, 18, or 36 months in one click."
            />
            <FeatureCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="Specialty-grouped Gantt"
              body="See concentration across oncology, neurology, immunology and more — with a chronological timeline of every readout."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileSearch className="h-3.5 w-3.5" />
            Data sourced live from{" "}
            <a
              href="https://clinicaltrials.gov"
              target="_blank"
              rel="noreferrer"
              className="text-foreground hover:text-primary transition-colors"
            >
              ClinicalTrials.gov
            </a>
          </div>
          <div>Trialscope — Phase 2/3 pipeline intelligence</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground mb-3">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
