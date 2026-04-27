/**
 * Date and string formatters.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(date?: string): string {
  if (!date) return "—";
  const parts = date.split("-");
  const year = parts[0];
  if (!year || isNaN(Number(year))) return date;
  if (parts.length === 1) return year;
  const monthIdx = Number(parts[1]) - 1;
  const monthLabel = MONTHS[monthIdx] ?? "";
  if (parts.length === 2) return `${monthLabel} ${year}`;
  return `${monthLabel} ${parts[2]}, ${year}`;
}

export function parseDateMs(date?: string): number | null {
  if (!date) return null;
  const parts = date.split("-");
  let iso: string;
  if (parts.length === 1) iso = `${date}-01-01`;
  else if (parts.length === 2) iso = `${date}-01`;
  else iso = date;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export function formatPhase(phase: string): string {
  if (!phase || phase === "NA") return "—";
  return phase
    .replace(/PHASE/g, "P")
    .replace(/EARLY_P1/g, "EP1");
}

export function truncate(text: string, max = 280): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function daysSince(date?: string): number | null {
  const ms = parseDateMs(date);
  if (!ms) return null;
  return Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
}
