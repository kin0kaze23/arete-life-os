/**
 * Event Utilities Module
 *
 * Extracted from useAura.ts for better maintainability and testability.
 * Handles event detection and date/time parsing from natural language.
 */

// Keywords that indicate an event in user input
const EVENT_KEYWORDS =
  /\b(trip|travel|flight|meeting|appointment|doctor|dentist|wedding|birthday|anniversary|conference|dinner|lunch|breakfast|brunch|date|event|deadline|due|call|interview|exam|test|class|lecture|session|ceremony|party|celebration|workshop|seminar|webinar|retreat|summit|tennis|soccer|football|basketball|baseball|volleyball|badminton|golf|swim|swimming|run|running|jog|jogging|gym|workout|yoga|pilates|cycling|bike|hike|hiking|climb|climbing|coffee|tea|drinks|cocktails|beer|wine|hangout|catchup|meetup|gathering|presentation|demo|review|training|onboarding|standup|sync|checkpoint|kickoff|retrospective|sprint)\b/i;

/**
 * Check if input text likely describes an event
 */
export const isLikelyEvent = (input: string): boolean => EVENT_KEYWORDS.test(input);

/**
 * Convert Date to ISO date string (YYYY-MM-DD)
 */
const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Build a valid Date object, returning null if invalid
 */
const buildDate = (year: number, month: number, day: number): Date | null => {
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  ) {
    return candidate;
  }
  return null;
};

/**
 * Parse time from natural language text
 * Examples: "10 PM" → "22:00", "3:30 AM" → "03:30", "14:00" → "14:00"
 */
export const parseTimeFromText = (input: string): string | null => {
  const text = input.toLowerCase();

  // Match 12-hour format: "10 PM", "3:30 PM", "10pm", "3:30pm"
  const time12Match = text.match(/\b(\d{1,2})(:(\d{2}))?\s*(am|pm)\b/i);
  if (time12Match) {
    let hours = parseInt(time12Match[1]);
    const minutes = time12Match[3] || '00';
    const period = time12Match[4].toLowerCase();

    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // Match 24-hour format: "14:30", "09:00"
  const time24Match = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (time24Match) {
    const hours = parseInt(time24Match[1]);
    const minutes = time24Match[2];
    if (hours >= 0 && hours < 24 && parseInt(minutes) >= 0 && parseInt(minutes) < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  return null;
};

/**
 * Parse date from natural language text
 * Examples: "tomorrow", "next week", "Jan 15", "2026-01-29"
 */
export const parseDateFromText = (input: string): string | null => {
  const text = input.toLowerCase();
  const now = new Date();

  // Relative dates
  if (text.includes('today')) {
    return toIsoDate(now);
  }

  if (text.includes('tomorrow')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    return toIsoDate(date);
  }

  const inDays = text.match(/\bin\s+(\d{1,2})\s+day/);
  if (inDays) {
    const date = new Date(now);
    date.setDate(date.getDate() + Number(inDays[1]));
    return toIsoDate(date);
  }

  const inWeeks = text.match(/\bin\s+(\d{1,2})\s+week/);
  if (inWeeks) {
    const date = new Date(now);
    date.setDate(date.getDate() + Number(inWeeks[1]) * 7);
    return toIsoDate(date);
  }

  const inMonths = text.match(/\bin\s+(\d{1,2})\s+month/);
  if (inMonths) {
    const date = new Date(now);
    date.setMonth(date.getMonth() + Number(inMonths[1]));
    return toIsoDate(date);
  }

  if (text.includes('next week')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 7);
    return toIsoDate(date);
  }

  if (text.includes('next month')) {
    const date = new Date(now);
    date.setMonth(date.getMonth() + 1);
    return toIsoDate(date);
  }

  // ISO format: 2026-01-29
  const isoMatch = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    const date = buildDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    return date ? toIsoDate(date) : null;
  }

  // US format: 01/29 or 01/29/2026
  const usMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (usMatch) {
    const month = Number(usMatch[1]);
    const day = Number(usMatch[2]);
    const rawYear = usMatch[3] ? Number(usMatch[3]) : now.getFullYear();
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    let date = buildDate(year, month, day);
    if (date && date < now && !usMatch[3]) {
      date = buildDate(year + 1, month, day);
    }
    return date ? toIsoDate(date) : null;
  }

  // Month name format: "Jan 15" or "January 15, 2026"
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  const monthMatch = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/
  );
  if (monthMatch) {
    const monthIndex = months.findIndex((m) => m.startsWith(monthMatch[1].slice(0, 3)));
    const day = Number(monthMatch[2]);
    const rawYear = monthMatch[3] ? Number(monthMatch[3]) : now.getFullYear();
    let date = buildDate(rawYear, monthIndex + 1, day);
    if (date && date < now && !monthMatch[3]) {
      date = buildDate(rawYear + 1, monthIndex + 1, day);
    }
    return date ? toIsoDate(date) : null;
  }

  // Reverse month format: "15 Jan" or "15 January 2026"
  const reverseMonthMatch = text.match(
    /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s*(\d{4}))?\b/
  );
  if (reverseMonthMatch) {
    const monthIndex = months.findIndex((m) => m.startsWith(reverseMonthMatch[2].slice(0, 3)));
    const day = Number(reverseMonthMatch[1]);
    const rawYear = reverseMonthMatch[3] ? Number(reverseMonthMatch[3]) : now.getFullYear();
    let date = buildDate(rawYear, monthIndex + 1, day);
    if (date && date < now && !reverseMonthMatch[3]) {
      date = buildDate(rawYear + 1, monthIndex + 1, day);
    }
    return date ? toIsoDate(date) : null;
  }

  return null;
};

/**
 * Parse both date and time from natural language text
 * Returns ISO datetime string: "2026-01-29T22:00:00" or just date "2026-01-29"
 */
export const parseDateTimeFromText = (input: string): string | null => {
  const date = parseDateFromText(input);
  if (!date) return null;

  const time = parseTimeFromText(input);
  if (time) {
    return `${date}T${time}:00`;
  }

  return date;
};

/**
 * Extract URLs from text
 */
export const extractLinks = (input: string): string[] =>
  input.match(/https?:\/\/[^\s)]+/gi)?.map((link) => link.trim()) ?? [];
