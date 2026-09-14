import * as chrono from "chrono-node";

export type DetectedReminder = {
  /** The matched text span inside the note, e.g. "come back in spring" */
  text: string;
  /** Resolved absolute date/time for the follow-up */
  date: Date;
  /** Human-friendly label to show the rep, e.g. "Follow up: Spring (Mar 20, 2027)" */
  label: string;
};

const SEASONS: Record<string, { month: number; day: number }> = {
  spring: { month: 3, day: 20 },
  summer: { month: 6, day: 21 },
  fall: { month: 9, day: 22 },
  autumn: { month: 9, day: 22 },
  winter: { month: 12, day: 21 },
};

/** Next occurrence of a season's start date, rolling into next year if this year's has passed. */
function nextSeasonDate(season: keyof typeof SEASONS, now: Date): Date {
  const { month, day } = SEASONS[season];
  let year = now.getFullYear();
  let candidate = new Date(year, month - 1, day, 9, 0, 0);
  // If it's within 3 days or already past, roll to next year so "come back in spring" said in April means next spring.
  const bufferMs = 1000 * 60 * 60 * 24 * 3;
  if (candidate.getTime() < now.getTime() + bufferMs) {
    year += 1;
    candidate = new Date(year, month - 1, day, 9, 0, 0);
  }
  return candidate;
}

function seasonLabel(season: string) {
  return season.charAt(0).toUpperCase() + season.slice(1);
}

/**
 * Scan free-text note content for follow-up timing language and resolve it to
 * concrete dates. Handles seasonal phrases ("come back in the spring") that
 * chrono-node doesn't understand natively, plus everything chrono already
 * covers (relative dates, weekdays, "in 2 weeks", explicit dates, etc.).
 */
export function detectReminders(text: string, referenceDate: Date = new Date()): DetectedReminder[] {
  const results: DetectedReminder[] = [];
  const seasonPattern = /\b(next\s+)?(spring|summer|fall|autumn|winter)\b/gi;

  let match: RegExpExecArray | null;
  const seasonSpans: Array<{ start: number; end: number }> = [];
  while ((match = seasonPattern.exec(text)) !== null) {
    const season = match[2].toLowerCase() as keyof typeof SEASONS;
    const date = nextSeasonDate(season, referenceDate);
    results.push({
      text: match[0],
      date,
      label: `${seasonLabel(season)} (${formatDate(date)})`,
    });
    seasonSpans.push({ start: match.index, end: match.index + match[0].length });
  }

  const chronoResults = chrono.parse(text, referenceDate, { forwardDate: true });
  for (const r of chronoResults) {
    const overlapsSeason = seasonSpans.some(
      (s) => r.index < s.end && r.index + r.text.length > s.start
    );
    if (overlapsSeason) continue;
    const date = r.start.date();
    if (date.getTime() <= referenceDate.getTime() - 1000 * 60 * 60 * 24) continue;
    results.push({
      text: r.text,
      date,
      label: `${formatDate(date)}`,
    });
  }

  return results;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const QUICK_REMINDER_OPTIONS = [
  { key: "tomorrow", label: "Tomorrow", getDate: (now: Date) => addDays(now, 1) },
  { key: "3days", label: "In 3 days", getDate: (now: Date) => addDays(now, 3) },
  { key: "1week", label: "Next week", getDate: (now: Date) => addDays(now, 7) },
  { key: "2weeks", label: "In 2 weeks", getDate: (now: Date) => addDays(now, 14) },
  { key: "1month", label: "Next month", getDate: (now: Date) => addMonths(now, 1) },
  { key: "spring", label: "Spring", getDate: (now: Date) => nextSeasonDate("spring", now) },
  { key: "summer", label: "Summer", getDate: (now: Date) => nextSeasonDate("summer", now) },
  { key: "fall", label: "Fall", getDate: (now: Date) => nextSeasonDate("fall", now) },
  { key: "winter", label: "Winter", getDate: (now: Date) => nextSeasonDate("winter", now) },
] as const;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  d.setHours(9, 0, 0, 0);
  return d;
}
