/**
 * Qualitative MR Agency Playbook — date math + email send windows
 *
 * Source: qual_mr_playbook.pdf, sections 4-6 + section 8 (Pattern 1: Topline readout +30 days)
 *
 * The playbook indexes everything to FDA approval (month 0). Trial data gives us
 * Primary Completion Date (PCD); we model the rest of the lifecycle relative to PCD.
 * These are sensible industry defaults — surfaced clearly on the timeline so the
 * viewer understands the assumption.
 */

const MONTH_MS = 30.44 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Add N months to a Date (uses 30.44-day average; we don't need calendar precision here). */
function addMonths(d: Date, months: number): Date {
  return new Date(d.getTime() + months * MONTH_MS);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

/** Parse YYYY-MM, YYYY-MM-DD, or full ISO into a Date. Returns null if unparseable. */
export function parsePcd(raw: string | undefined): Date | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const day = m[3] ? parseInt(m[3], 10) : 15; // Mid-month if no day given
  return new Date(Date.UTC(year, month, day));
}

/** A milestone on the lifecycle (trial readout, filing, approval, launch). */
export type LifecycleMilestone = {
  id: "readout" | "filing" | "approval" | "launch";
  label: string;
  date: Date;
  /** True when this date is derived/estimated from PCD rather than a reported fact. */
  estimated: boolean;
  /** Tooltip / footer note. */
  note: string;
};

/** A qual-MR email to send. */
export type EmailMilestone = {
  id: "early" | "pre_launch" | "launch";
  label: string;
  shortLabel: string;
  /** Recommended send date (the front of the window). */
  sendDate: Date;
  /** End of the recommended window. */
  windowEndDate: Date;
  /** Phase color key (matches the timeline phase bands). */
  phase: "early" | "pre_launch" | "launch";
  /** Trigger event from the playbook. */
  trigger: string;
  /** What to pitch (1-line). */
  pitch: string;
};

export type PlaybookPhase = {
  id: "early" | "pre_launch" | "launch";
  label: string;
  /** Months relative to FDA approval (from playbook headers). */
  startMonthsFromApproval: number;
  endMonthsFromApproval: number;
  startDate: Date;
  endDate: Date;
};

export type QualTimeline = {
  pcd: Date;
  /** Whether the PCD on file is reported (ACTUAL) vs ESTIMATED by ClinicalTrials.gov. */
  pcdEstimated: boolean;
  filing: Date;
  approval: Date;
  launch: Date;
  milestones: LifecycleMilestone[];
  emails: EmailMilestone[];
  phases: PlaybookPhase[];
  /** Inclusive bounds for the timeline x-axis. */
  axisStart: Date;
  axisEnd: Date;
};

/** Industry-default offsets from PCD (the playbook anchors to FDA approval; we derive). */
export const LIFECYCLE_OFFSETS_MONTHS = {
  // Topline readout typically falls at or just after PCD
  readout: 0,
  // NDA/BLA filing: ~6 months for data lock + module compile
  filing: 6,
  // PDUFA / FDA approval: standard 10-month review (priority is 6); we use ~14mo from PCD
  approval: 14,
  // Commercial launch: ~1 month after approval
  launch: 15,
} as const;

/**
 * Build the qualitative-research timeline for a single trial, anchored on PCD.
 * Returns null if PCD is unparseable.
 */
export function buildQualTimeline(
  primaryCompletionDate: string | undefined,
  primaryCompletionDateType: string | undefined,
): QualTimeline | null {
  const pcd = parsePcd(primaryCompletionDate);
  if (!pcd) return null;

  const pcdEstimated = primaryCompletionDateType !== "ACTUAL";

  const filing = addMonths(pcd, LIFECYCLE_OFFSETS_MONTHS.filing);
  const approval = addMonths(pcd, LIFECYCLE_OFFSETS_MONTHS.approval);
  const launch = addMonths(pcd, LIFECYCLE_OFFSETS_MONTHS.launch);

  const milestones: LifecycleMilestone[] = [
    {
      id: "readout",
      label: "Topline readout",
      date: pcd,
      estimated: pcdEstimated,
      note: pcdEstimated
        ? "Primary completion date as reported on ClinicalTrials.gov (estimated)."
        : "Actual primary completion date.",
    },
    {
      id: "filing",
      label: "NDA / BLA filing",
      date: filing,
      estimated: true,
      note: "Modeled at PCD + 6 months — typical data lock + filing window.",
    },
    {
      id: "approval",
      label: "FDA approval (modeled)",
      date: approval,
      estimated: true,
      note: "Modeled at PCD + 14 months — standard 10-month PDUFA review after filing.",
    },
    {
      id: "launch",
      label: "Commercial launch",
      date: launch,
      estimated: true,
      note: "Modeled at approval + 1 month.",
    },
  ];

  // Phase bands per playbook section headers
  const phases: PlaybookPhase[] = [
    {
      id: "early",
      label: "Early strategic",
      startMonthsFromApproval: -30,
      endMonthsFromApproval: -18,
      startDate: addMonths(approval, -30),
      endDate: addMonths(approval, -18),
    },
    {
      id: "pre_launch",
      label: "Pre-launch",
      startMonthsFromApproval: -18,
      endMonthsFromApproval: -2,
      startDate: addMonths(approval, -18),
      endDate: addMonths(approval, -2),
    },
    {
      id: "launch",
      label: "Launch & in-market",
      startMonthsFromApproval: -2,
      endMonthsFromApproval: 12,
      startDate: addMonths(approval, -2),
      endDate: addMonths(approval, 12),
    },
  ];

  // Email milestones — see playbook §4, §5, §6 "WHEN TO PITCH" boxes + §8 Pattern 1
  const emails: EmailMilestone[] = [
    {
      id: "early",
      label: "Early strategic outreach email",
      shortLabel: "Early",
      // "Reach out within 30 days" of topline readout (§4 + §8 Pattern 1: Topline readout +30 days)
      sendDate: addDays(pcd, 1),
      windowEndDate: addDays(pcd, 30),
      phase: "early",
      trigger: "Phase 2/3 topline readout · breakthrough or fast-track designation",
      pitch:
        "Disease landscape qual, KOL mapping IDIs, or qual-first HCP segmentation — named-buyer proposal within 4 weeks.",
    },
    {
      id: "pre_launch",
      label: "Pre-launch outreach email",
      shortLabel: "Pre-Launch",
      // "Brand-team budget for message work typically opens within 30 days of filing acceptance" (§5)
      sendDate: addDays(filing, 1),
      windowEndDate: addDays(filing, 30),
      phase: "pre_launch",
      trigger: "FDA filing acceptance · advisory committee dates · PDUFA assignment",
      pitch:
        "HCP message / concept testing, payer P&T simulations, multi-specialty advisory boards.",
    },
    {
      id: "launch",
      label: "Launch / in-market outreach email",
      shortLabel: "Launch / In-Market",
      // "Approval +30 days" trigger (§6)
      sendDate: addDays(approval, 1),
      windowEndDate: addDays(approval, 30),
      phase: "launch",
      trigger: "Approval +30 days · first quarterly earnings call · 'slower than expected' uptake commentary",
      pitch:
        "Post-launch prescriber barrier IDIs, patient experience qual, payer reaction follow-up — speed wins.",
    },
  ];

  // Axis: from PCD - 6 months (just before readout) to launch + 6 months (full launch window)
  const axisStart = addMonths(pcd, -6);
  const axisEnd = addMonths(launch, 6);

  return {
    pcd,
    pcdEstimated,
    filing,
    approval,
    launch,
    milestones,
    emails,
    phases,
    axisStart,
    axisEnd,
  };
}

/** Format a Date as e.g. "Apr 26, 2026". Uses UTC to avoid TZ surprises. */
export function formatTimelineDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Format a Date as e.g. "Apr 2026". */
export function formatTimelineMonth(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Phase visual tokens — matches the dashboard teal palette. */
export const PHASE_COLORS = {
  early: { fill: "#FEF3E7", stroke: "#E8B86A", text: "#7A4F12" },
  pre_launch: { fill: "#D8EEF0", stroke: "#5BA9B0", text: "#0E5A60" },
  launch: { fill: "#0E7C84", stroke: "#0E7C84", text: "#FFFFFF" },
} as const;
