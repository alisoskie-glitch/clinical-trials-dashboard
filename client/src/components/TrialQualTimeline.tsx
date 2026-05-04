import { forwardRef, useMemo } from "react";
import type { Trial } from "@shared/schema";
import {
  buildQualTimeline,
  formatTimelineDate,
  formatTimelineMonth,
  PHASE_COLORS,
  type QualTimeline,
} from "@/lib/qual-playbook";
import { Logo } from "./Logo";

/**
 * Full-bleed visual timeline for a single trial, rendered as inline SVG so it
 * exports cleanly to PNG (html2canvas) and PDF (jsPDF -> image).
 *
 * The wrapper <div> has data-export-root for the modal to target on export.
 */
export const TrialQualTimeline = forwardRef<HTMLDivElement, { trial: Trial }>(
  function TrialQualTimeline({ trial }, ref) {
    const timeline = useMemo(
      () => buildQualTimeline(trial.primaryCompletionDate, trial.primaryCompletionDateType),
      [trial.primaryCompletionDate, trial.primaryCompletionDateType],
    );

    if (!timeline) {
      return (
        <div ref={ref} className="p-12 text-center text-muted-foreground">
          This trial has no primary completion date on file, so a qualitative-research
          timeline cannot be built.
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-export-root
        className="bg-white text-slate-900 p-8 font-sans"
        style={{ width: "1280px", minHeight: "720px" }}
      >
        <Header trial={trial} timeline={timeline} />
        <TimelineSvg trial={trial} timeline={timeline} />
        <EmailDetail timeline={timeline} />
        <Footer />
      </div>
    );
  },
);

function Header({ trial, timeline }: { trial: Trial; timeline: QualTimeline }) {
  return (
    <div className="flex items-start justify-between gap-6 pb-5 border-b border-slate-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-slate-500 font-medium">
          <span>Qualitative MR engagement timeline</span>
          <span className="text-slate-300">·</span>
          <span>{trial.specialty}</span>
          {trial.acronym && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-teal-700 font-semibold">{trial.acronym}</span>
            </>
          )}
        </div>
        <h2 className="mt-1.5 text-[22px] leading-tight font-semibold text-slate-900 max-w-3xl">
          {trial.briefTitle}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-slate-600">
          <span>
            <span className="text-slate-400">NCT</span>{" "}
            <span className="font-mono text-slate-700">{trial.nctId}</span>
          </span>
          <span>
            <span className="text-slate-400">Phase</span>{" "}
            <span className="font-medium text-slate-800">{formatPhase(trial.phase)}</span>
          </span>
          <span>
            <span className="text-slate-400">Sponsor</span>{" "}
            <span className="font-medium text-slate-800">{trial.leadSponsor}</span>
          </span>
          <span>
            <span className="text-slate-400">Primary completion</span>{" "}
            <span className="font-medium text-slate-800">{formatTimelineDate(timeline.pcd)}</span>
            {timeline.pcdEstimated && (
              <span className="ml-1 text-[10px] text-slate-500">(est.)</span>
            )}
          </span>
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1 pt-1">
        <div className="flex items-center gap-1.5 text-teal-700">
          <Logo size={18} />
          <span className="font-semibold tracking-tight text-slate-800 text-sm">Pipeline Planner</span>
        </div>
        <div className="text-[10px] text-slate-500">Qual MR Playbook · April 2026</div>
      </div>
    </div>
  );
}

const SVG_W = 1216; // 1280 - 2*32 padding
const SVG_H = 410;
// Top margin holds the phase-label header that sits ABOVE the band rect, so
// it can never collide with the email pins inside the band.
// Bottom margin gives breathing room below the colored band for the staggered
// milestone labels (e.g. "Commercial launch") so they stay visually inside the
// chart frame.
const MARGIN = { top: 80, right: 40, bottom: 30, left: 40 };
const PLOT_W = SVG_W - MARGIN.left - MARGIN.right;
const PLOT_H = SVG_H - MARGIN.top - MARGIN.bottom;

// Approximate width-per-character for the phase label font (11px, semibold,
// letterSpacing 1.4 — each glyph takes ~7.2px in caps).
const PHASE_LABEL_CHAR_PX = 7.2;
const PHASE_SUB_CHAR_PX = 5.4; // 10px regular

// Pin badge dimensions — used by the overlap solver.
const PIN_HALF_W = 58;
const PIN_W = 116;

function TimelineSvg({ trial: _trial, timeline }: { trial: Trial; timeline: QualTimeline }) {
  const { axisStart, axisEnd, phases, milestones, emails, approval } = timeline;

  const span = axisEnd.getTime() - axisStart.getTime();
  const x = (d: Date) => ((d.getTime() - axisStart.getTime()) / span) * PLOT_W;

  // Generate quarterly tick labels along the axis
  const ticks: { date: Date; x: number }[] = [];
  const start = new Date(axisStart);
  start.setUTCDate(1);
  // Snap to next quarter boundary
  const startMonth = start.getUTCMonth();
  const snapMonth = Math.ceil(startMonth / 3) * 3;
  start.setUTCMonth(snapMonth);
  for (let cursor = new Date(start); cursor <= axisEnd; cursor.setUTCMonth(cursor.getUTCMonth() + 3)) {
    ticks.push({ date: new Date(cursor), x: x(cursor) });
  }

  const baselineY = MARGIN.top + PLOT_H * 0.55;

  return (
    <div className="mt-5">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        height={SVG_H}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Phase bands — the band rectangle starts at MARGIN.top; the phase
            label and subtitle live ABOVE the band so they can't collide with
            the email pins that float above the baseline INSIDE the band. */}
        {phases.map((p) => {
          const px = Math.max(0, x(p.startDate));
          const pw = Math.min(PLOT_W, x(p.endDate)) - px;
          const colors = PHASE_COLORS[p.id];
          if (pw <= 0) return null;

          // Pick the longest label that fits inside the band width.
          const pad = 6;
          const fits = (txt: string, perChar: number) => txt.length * perChar <= pw - pad * 2;
          const fullLabel = p.label;
          const shortLabel = abbreviatePhaseLabel(p.label);
          let labelText: string | null = fullLabel;
          if (!fits(fullLabel, PHASE_LABEL_CHAR_PX)) {
            labelText = fits(shortLabel, PHASE_LABEL_CHAR_PX) ? shortLabel : null;
          }
          const subtitle = formatPhaseRange(p.startMonthsFromApproval, p.endMonthsFromApproval);
          const subtitleShort = formatPhaseRangeShort(p.startMonthsFromApproval, p.endMonthsFromApproval);
          let subtitleText: string | null = subtitle;
          if (!fits(subtitle, PHASE_SUB_CHAR_PX)) {
            subtitleText = fits(subtitleShort, PHASE_SUB_CHAR_PX) ? subtitleShort : null;
          }

          return (
            <g key={p.id}>
              <rect
                x={MARGIN.left + px}
                y={MARGIN.top}
                width={pw}
                height={PLOT_H}
                fill={colors.fill}
                opacity={p.id === "launch" ? 0.18 : 0.55}
              />
              {labelText && (
                <text
                  x={MARGIN.left + px + pw / 2}
                  y={MARGIN.top - 26}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  letterSpacing={1.4}
                  fill={p.id === "launch" ? "#0E7C84" : colors.text}
                  style={{ textTransform: "uppercase" }}
                >
                  {labelText}
                </text>
              )}
              {subtitleText && (
                <text
                  x={MARGIN.left + px + pw / 2}
                  y={MARGIN.top - 12}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#64748B"
                >
                  {subtitleText}
                </text>
              )}
            </g>
          );
        })}

        {/* Phase divider lines */}
        {phases.slice(0, -1).map((p) => (
          <line
            key={`div-${p.id}`}
            x1={MARGIN.left + x(p.endDate)}
            x2={MARGIN.left + x(p.endDate)}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_H}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        ))}

        {/* Baseline */}
        <line
          x1={MARGIN.left}
          x2={MARGIN.left + PLOT_W}
          y1={baselineY}
          y2={baselineY}
          stroke="#1E293B"
          strokeWidth={2}
        />

        {/* Quarterly tick marks + labels */}
        {ticks.map((t) => (
          <g key={t.date.toISOString()}>
            <line
              x1={MARGIN.left + t.x}
              x2={MARGIN.left + t.x}
              y1={baselineY - 4}
              y2={baselineY + 4}
              stroke="#1E293B"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left + t.x}
              y={baselineY + 18}
              textAnchor="middle"
              fontSize={10}
              fill="#475569"
            >
              {formatTimelineMonth(t.date)}
            </text>
          </g>
        ))}

        {/* "Approval = month 0" anchor caption */}
        <text
          x={MARGIN.left + x(approval)}
          y={baselineY + 38}
          textAnchor="middle"
          fontSize={9}
          fill="#94A3B8"
          fontStyle="italic"
        >
          (Approval = month 0)
        </text>

        {/* Trial milestones — vertical markers below baseline.
            Stagger labels vertically when adjacent milestones are too close
            horizontally (≤ ~110px apart) so text doesn't collide. */}
        {(() => {
          const positions = milestones.map((m) => ({ m, mx: MARGIN.left + x(m.date) }));
          // Assign a row (0 or 1) per milestone; if previous row-0 milestone is
          // within MIN_GAP px, push current to row 1, then alternate as needed.
          const MIN_GAP = 110;
          const rows: number[] = [];
          for (let i = 0; i < positions.length; i++) {
            if (i === 0) {
              rows.push(0);
              continue;
            }
            // Find the most recent milestone in row 0 — if too close, use row 1
            let row = 0;
            for (let j = i - 1; j >= 0; j--) {
              if (rows[j] === 0 && Math.abs(positions[i].mx - positions[j].mx) < MIN_GAP) {
                row = 1;
                break;
              }
            }
            rows.push(row);
          }
          // Approximate label widths so we can clamp the label x-position to
          // stay inside the chart's plot area when a milestone is near an edge.
          const LABEL_CHAR_PX = 5.6; // 10px semibold
          const DATE_CHAR_PX = 5.0; // 9px regular
          const minLabelX = MARGIN.left;
          const maxLabelX = MARGIN.left + PLOT_W;
          return positions.map(({ m, mx }, i) => {
            const labelOffset = rows[i] === 1 ? 30 : 0;
            const stemEndY = baselineY + 50 + labelOffset;
            const labelText = m.label;
            const dateText =
              formatTimelineDate(m.date) + (m.estimated && m.id !== "readout" ? " · est." : "");
            // Clamp each text x within plot bounds, switching textAnchor when
            // we run out of room (so the text isn't shifted into the marker).
            const labelHalf = (labelText.length * LABEL_CHAR_PX) / 2;
            const dateHalf = (dateText.length * DATE_CHAR_PX) / 2;
            let labelX = mx;
            let labelAnchor: "start" | "middle" | "end" = "middle";
            if (mx + labelHalf > maxLabelX) {
              labelX = maxLabelX;
              labelAnchor = "end";
            } else if (mx - labelHalf < minLabelX) {
              labelX = minLabelX;
              labelAnchor = "start";
            }
            let dateX = mx;
            let dateAnchor: "start" | "middle" | "end" = "middle";
            if (mx + dateHalf > maxLabelX) {
              dateX = maxLabelX;
              dateAnchor = "end";
            } else if (mx - dateHalf < minLabelX) {
              dateX = minLabelX;
              dateAnchor = "start";
            }
            return (
              <g key={m.id}>
                <line
                  x1={mx}
                  x2={mx}
                  y1={baselineY}
                  y2={stemEndY}
                  stroke="#94A3B8"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <circle cx={mx} cy={baselineY} r={5} fill="#1E293B" />
                <circle cx={mx} cy={baselineY} r={2.5} fill="#FFFFFF" />
                <text
                  x={labelX}
                  y={baselineY + 60 + labelOffset}
                  textAnchor={labelAnchor}
                  fontSize={10}
                  fontWeight={600}
                  fill="#1E293B"
                >
                  {labelText}
                </text>
                <text
                  x={dateX}
                  y={baselineY + 73 + labelOffset}
                  textAnchor={dateAnchor}
                  fontSize={9}
                  fill="#64748B"
                >
                  {dateText}
                </text>
              </g>
            );
          });
        })()}

        {/* Email pins — above baseline. Each pin badge is 116px wide and is
            centered on the send date by default. We clamp horizontally so the
            badge stays within [MARGIN.left, MARGIN.left + PLOT_W] (never
            overflows the chart on either side). Pin heights are staggered so
            stacked pins don't overlap. */}
        {emails.map((e, i) => {
          const ex = MARGIN.left + x(e.sendDate);
          const wxEnd = MARGIN.left + x(e.windowEndDate);
          // Stagger pin heights so badges at similar x positions don't overlap
          const pinHeight = 70 + (i % 2) * 22;
          const pinY = baselineY - pinHeight;
          const colors = PHASE_COLORS[e.phase];

          // Compute per-pin badge width based on its actual label text so
          // longer labels (e.g. "LAUNCH / IN-MARKET") never get clipped.
          const badgeText = `${emailNumber(i)} · ${e.shortLabel}`.toUpperCase();
          // Approx 6.0px per uppercase char at fontSize=10 weight=700 with letterSpacing=0.5,
          // plus 14px horizontal padding on each side.
          const pinW = Math.max(116, Math.ceil(badgeText.length * 6.0) + 28);
          const pinHalfW = pinW / 2;

          // Clamp the badge so it stays within the chart's plot area on both
          // sides. badgeOffset is the horizontal shift of the badge center
          // relative to the stem (ex). 0 = centered, +n = shifted right.
          const minBadgeCenter = MARGIN.left + pinHalfW;
          const maxBadgeCenter = MARGIN.left + PLOT_W - pinHalfW;
          const badgeCx = Math.max(minBadgeCenter, Math.min(maxBadgeCenter, ex));
          const badgeOffset = badgeCx - ex;

          return (
            <g key={e.id}>
              {/* Send-window bracket on baseline */}
              <line
                x1={ex}
                x2={Math.max(wxEnd, ex + 4)}
                y1={baselineY - 6}
                y2={baselineY - 6}
                stroke={colors.stroke}
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* Vertical stem (always at the actual send-date x) */}
              <line
                x1={ex}
                x2={ex}
                y1={baselineY - 6}
                y2={pinY + 8}
                stroke={colors.stroke}
                strokeWidth={1.5}
              />
              {/* Pin badge — may be shifted horizontally if the stem is near
                  a chart edge, but is connected to the stem by a short tail. */}
              {Math.abs(badgeOffset) > 1 && (
                <line
                  x1={ex}
                  x2={ex + badgeOffset}
                  y1={pinY + 8}
                  y2={pinY + 8}
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                />
              )}
              <g transform={`translate(${ex + badgeOffset}, ${pinY})`}>
                <rect
                  x={-pinHalfW}
                  y={-14}
                  width={pinW}
                  height={28}
                  rx={4}
                  fill={colors.stroke}
                />
                <text
                  x={0}
                  y={-2}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill="#FFFFFF"
                  letterSpacing={0.5}
                  style={{ textTransform: "uppercase" }}
                >
                  {emailNumber(i)} · {e.shortLabel}
                </text>
                <text
                  x={0}
                  y={10}
                  textAnchor="middle"
                  fontSize={9.5}
                  fill="#FFFFFF"
                  fillOpacity={0.92}
                >
                  Send {formatTimelineDate(e.sendDate)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function EmailDetail({ timeline }: { timeline: QualTimeline }) {
  return (
    <div className="mt-6">
      <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-slate-500 mb-3">
        Outreach playbook · qual MR engagement triggers
      </div>
      <div className="grid grid-cols-3 gap-4">
        {timeline.emails.map((e, i) => {
          const colors = PHASE_COLORS[e.phase];
          return (
            <div
              key={e.id}
              className="rounded border border-slate-200 overflow-hidden bg-white"
            >
              <div
                className="px-3 py-2 flex items-center justify-between"
                style={{ backgroundColor: colors.stroke, color: "#FFFFFF" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold opacity-80">
                    {emailNumber(i)}
                  </span>
                  <span className="text-[12px] font-semibold tracking-wide">
                    {e.shortLabel} email
                  </span>
                </div>
                <span className="text-[10px] opacity-90">
                  {formatTimelineDate(e.sendDate)}
                </span>
              </div>
              <div className="px-3 py-3 space-y-2">
                <div>
                  <div className="text-[9.5px] uppercase tracking-wider text-slate-400 font-semibold">
                    Send window
                  </div>
                  <div className="text-[12px] font-medium text-slate-800">
                    {formatTimelineDate(e.sendDate)} → {formatTimelineDate(e.windowEndDate)}
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] uppercase tracking-wider text-slate-400 font-semibold">
                    Trigger
                  </div>
                  <div className="text-[11.5px] text-slate-700 leading-snug">{e.trigger}</div>
                </div>
                <div>
                  <div className="text-[9.5px] uppercase tracking-wider text-slate-400 font-semibold">
                    What to pitch
                  </div>
                  <div className="text-[11.5px] text-slate-700 leading-snug">{e.pitch}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-5 pt-3 border-t border-slate-100 text-[10px] text-slate-500 leading-snug">
      <span className="font-semibold text-slate-600">Methodology · </span>
      Lifecycle dates are anchored on the trial's primary completion date (PCD).
      NDA/BLA filing is modeled at PCD + 6 months; FDA approval at PCD + 14 months
      (standard 10-month PDUFA review); commercial launch at approval + 1 month.
      Email send windows are derived from the Qualitative MR Agency Playbook (April 2026),
      sections 4–6.
    </div>
  );
}

// ---------- helpers ----------

function emailNumber(i: number): string {
  return ["①", "②", "③"][i] ?? `${i + 1}.`;
}

function formatPhase(raw: string): string {
  return raw
    .replace(/PHASE/g, "P")
    .replace(/_/g, " ")
    .replace(/\//g, " / ");
}

function formatPhaseRange(start: number, end: number): string {
  const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  return `${fmt(start)} to ${fmt(end)} mo vs. approval`;
}

/** Compact phase-range subtitle for narrow bands. */
function formatPhaseRangeShort(start: number, end: number): string {
  const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  return `${fmt(start)} to ${fmt(end)} mo`;
}

/** Drop subtitle words to make the phase header shorter when the band is narrow. */
function abbreviatePhaseLabel(label: string): string {
  // "Early Strategic" -> "Early"
  // "Pre-Launch" -> "Pre-Launch" (already short)
  // "Launch & In-Market" -> "Launch"
  return label
    .replace(/\s*&\s*In-?Market/i, "")
    .replace(/\s+Strategic$/i, "")
    .trim();
}
