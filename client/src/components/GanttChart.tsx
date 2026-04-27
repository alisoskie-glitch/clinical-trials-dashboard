import { useMemo } from "react";
import type { Trial } from "@shared/schema";
import { SPECIALTY_COLORS, type Specialty } from "@shared/specialty-taxonomy";
import { parseDateMs, formatDate, formatPhase } from "@/lib/format";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  trials: Trial[];
  windowMonths: number;
  onSelectTrial?: (trial: Trial) => void;
}

export function GanttChart({ trials, windowMonths, onSelectTrial }: Props) {
  const { sortedTrials, monthHeaders, todayMs, endMs } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setMonth(end.getMonth() + windowMonths);
    const todayMs = today.getTime();
    const endMs = end.getTime();

    const months: { label: string; ms: number }[] = [];
    const cursor = new Date(today);
    cursor.setDate(1);
    // Number of month tick marks based on windowMonths — show roughly 6 ticks
    const tickInterval = Math.max(1, Math.ceil(windowMonths / 6));
    while (cursor.getTime() <= endMs) {
      months.push({
        label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        ms: cursor.getTime(),
      });
      cursor.setMonth(cursor.getMonth() + tickInterval);
    }

    // Sort trials chronologically by completion date, then by specialty
    const sorted = [...trials].sort((a, b) => {
      const aMs = parseDateMs(a.primaryCompletionDate) ?? Infinity;
      const bMs = parseDateMs(b.primaryCompletionDate) ?? Infinity;
      return aMs - bMs;
    });

    return { sortedTrials: sorted, monthHeaders: months, todayMs, endMs };
  }, [trials, windowMonths]);

  const totalRange = endMs - todayMs;
  // Scale row height down when many trials so the chart stays readable without becoming absurdly tall
  const rowHeight = sortedTrials.length > 60 ? 12 : sortedTrials.length > 30 ? 14 : 18;
  const chartHeight = Math.max(sortedTrials.length * rowHeight + 20, 200);

  if (sortedTrials.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No trials to display
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Month axis */}
      <div className="relative h-6 border-b border-border flex">
        {monthHeaders.map((m) => {
          const left = ((m.ms - todayMs) / totalRange) * 100;
          return (
            <div
              key={m.ms}
              className="absolute -translate-x-1/2 text-[11px] text-muted-foreground top-1 nums"
              style={{ left: `${left}%` }}
            >
              {m.label}
            </div>
          );
        })}
      </div>

      {/* Bars */}
      <div className="relative" style={{ height: chartHeight }}>
        {/* Vertical month gridlines */}
        {monthHeaders.map((m) => {
          const left = ((m.ms - todayMs) / totalRange) * 100;
          return (
            <div
              key={`grid-${m.ms}`}
              className="absolute top-0 bottom-0 w-px bg-border/50"
              style={{ left: `${left}%` }}
            />
          );
        })}

        {/* Today line */}
        <div className="absolute top-0 bottom-0 w-px bg-primary" style={{ left: "0%" }}>
          <div className="absolute top-0 -left-5 text-[10px] font-medium text-primary">
            Today
          </div>
        </div>

        {/* Trial bars */}
        {sortedTrials.map((t, i) => {
          const startMs = parseDateMs(t.startDate);
          const endTrialMs = parseDateMs(t.primaryCompletionDate);
          if (!endTrialMs) return null;

          const barStartMs = Math.max(startMs ?? todayMs, todayMs);
          const barEndMs = Math.min(endTrialMs, endMs);
          if (barEndMs <= todayMs) return null;

          const left = ((barStartMs - todayMs) / totalRange) * 100;
          const width = Math.max(((barEndMs - barStartMs) / totalRange) * 100, 0.5);
          const color = SPECIALTY_COLORS[t.specialty as Specialty] ?? "hsl(220 5% 50%)";
          const top = i * rowHeight + Math.max(2, Math.floor((rowHeight - 8) / 2));
          const barH = Math.min(rowHeight - 4, 12);

          return (
            <Tooltip key={t.nctId}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelectTrial?.(t)}
                  className="absolute rounded-sm transition-all hover:scale-y-150 focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top,
                    height: `${barH}px`,
                    backgroundColor: color,
                  }}
                  data-testid={`gantt-bar-${t.nctId}`}
                  aria-label={`${t.briefTitle} — completion ${formatDate(t.primaryCompletionDate)}`}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{t.acronym ?? t.briefTitle.slice(0, 80)}</div>
                  {t.acronym && <div className="text-xs text-muted-foreground">{t.briefTitle.slice(0, 100)}</div>}
                  <div className="flex gap-2 text-xs">
                    <span className="font-medium">{formatPhase(t.phase)}</span>
                    <span>·</span>
                    <span>{t.specialty}</span>
                  </div>
                  {t.drugNames.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Drugs: </span>
                      {t.drugNames.slice(0, 2).join(", ")}
                    </div>
                  )}
                  <div className="text-xs">
                    <span className="text-muted-foreground">Completes: </span>
                    {formatDate(t.primaryCompletionDate)}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground mt-2 px-1">
        Each bar = one trial · Color = specialty · Hover for details
      </p>
    </div>
  );
}
