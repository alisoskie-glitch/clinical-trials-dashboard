import { useMemo } from "react";
import type { Trial } from "@shared/schema";
import { SPECIALTY_COLORS, type Specialty } from "@shared/specialty-taxonomy";

interface Props {
  trials: Trial[];
  selectedSpecialty?: string | null;
  onSelectSpecialty?: (s: string | null) => void;
}

export function SpecialtyChart({ trials, selectedSpecialty, onSelectSpecialty }: Props) {
  const data = useMemo(() => {
    const counts = new Map<string, { p2: number; p3: number; total: number }>();
    for (const t of trials) {
      const entry = counts.get(t.specialty) ?? { p2: 0, p3: 0, total: 0 };
      entry.total++;
      if (t.phase.includes("PHASE3")) entry.p3++;
      else if (t.phase.includes("PHASE2")) entry.p2++;
      counts.set(t.specialty, entry);
    }
    return Array.from(counts.entries())
      .map(([specialty, counts]) => ({ specialty, ...counts }))
      .sort((a, b) => b.total - a.total);
  }, [trials]);

  const maxCount = Math.max(...data.map((d) => d.total), 1);

  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No trials to chart
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((d) => {
        const isActive = selectedSpecialty === d.specialty;
        const isFaded = selectedSpecialty && selectedSpecialty !== d.specialty;
        const barColor = SPECIALTY_COLORS[d.specialty as Specialty] ?? "hsl(220 5% 50%)";
        return (
          <button
            key={d.specialty}
            onClick={() => onSelectSpecialty?.(isActive ? null : d.specialty)}
            className={`w-full grid grid-cols-[170px_1fr_60px] items-center gap-3 text-left transition-opacity ${
              isFaded ? "opacity-40" : "opacity-100"
            }`}
            data-testid={`chart-specialty-${d.specialty.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="text-xs font-medium truncate" title={d.specialty}>
              {d.specialty}
            </div>
            <div className="relative h-7 bg-secondary rounded-sm overflow-hidden">
              {/* Phase 3 portion (deeper color) */}
              {d.p3 > 0 && (
                <div
                  className="absolute inset-y-0 left-0 transition-all"
                  style={{
                    width: `${(d.p3 / maxCount) * 100}%`,
                    backgroundColor: barColor,
                  }}
                />
              )}
              {/* Phase 2 portion (lighter, stacked after p3) */}
              {d.p2 > 0 && (
                <div
                  className="absolute inset-y-0 transition-all"
                  style={{
                    left: `${(d.p3 / maxCount) * 100}%`,
                    width: `${(d.p2 / maxCount) * 100}%`,
                    backgroundColor: barColor,
                    opacity: 0.55,
                  }}
                />
              )}
              <div className="absolute inset-y-0 right-2 flex items-center text-[11px] font-medium text-foreground/80 nums">
                {d.p3 > 0 && <span className="mr-1.5">P3·{d.p3}</span>}
                {d.p2 > 0 && <span>P2·{d.p2}</span>}
              </div>
            </div>
            <div className="text-sm font-semibold text-right nums" data-testid={`chart-count-${d.specialty.toLowerCase().replace(/\s+/g, "-")}`}>
              {d.total}
            </div>
          </button>
        );
      })}
    </div>
  );
}
