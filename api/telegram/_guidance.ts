type GuidancePreferencesLike = {
  telegramMode?: 'off' | 'digest' | 'important_only' | 'coach';
  quietHoursStart?: string;
  quietHoursEnd?: string;
  dailyTelegramLimit?: number;
};

type GuidanceDigestLike = {
  summary?: string;
  doItems?: Array<{ title?: string; category?: string }>;
  watchItems?: Array<{ signal?: string; severity?: string; nextPreventionStep?: string }>;
};

type GuidanceQuestionLike = {
  prompt?: string;
  reason?: string;
  urgency?: 'low' | 'medium' | 'high';
};

type TelegramUpdateLike = {
  message?: {
    text?: string;
    chat?: { id?: number };
  };
};

const parseTimeParts = (value?: string) => {
  const [rawHour, rawMinute] = (value || '').split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return { hour, minute };
};

const getLocalTime = (timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || '0');
  return { hour, minute, totalMinutes: hour * 60 + minute };
};

export const isWithinQuietHours = (timeZone: string, preferences: GuidancePreferencesLike = {}) => {
  const start = parseTimeParts(preferences.quietHoursStart);
  const end = parseTimeParts(preferences.quietHoursEnd);
  if (!start || !end) return false;

  const local = getLocalTime(timeZone);
  const current = local.totalMinutes;
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return current >= startMinutes && current < endMinutes;
  }
  return current >= startMinutes || current < endMinutes;
};

export const inferGuidanceMessageType = (
  timeZone: string,
  digest: GuidanceDigestLike,
  question: GuidanceQuestionLike | null,
  force = false
) => {
  if (force) return 'manual';
  const { hour } = getLocalTime(timeZone);
  const topWatch = digest.watchItems?.[0];

  if (topWatch?.severity === 'high' && hour >= 8 && hour <= 20) return 'important';
  if (question?.prompt && (question.urgency === 'high' || hour === 12)) return 'question';
  if (hour >= 7 && hour <= 9) return 'morning';
  if (hour >= 20 && hour <= 22) return 'evening';
  return null;
};

export const buildGuidanceTelegramMessage = (
  digest: GuidanceDigestLike,
  question: GuidanceQuestionLike | null,
  messageType: string
) => {
  const lines: string[] = [];
  const topDo = digest.doItems?.[0];
  const topWatch = digest.watchItems?.[0];

  if (messageType === 'evening') {
    lines.push('Evening review');
    if (topWatch?.signal) lines.push(`Watch: ${topWatch.signal}`);
    if (question?.prompt) lines.push(`Reflect: ${question.prompt}`);
    return lines.join('\n');
  }

  if (messageType === 'question') {
    lines.push('Quick clarification');
    if (question?.prompt) lines.push(question.prompt);
    if (question?.reason) lines.push(`Why: ${question.reason}`);
    return lines.join('\n');
  }

  lines.push('Areté brief');
  if (digest.summary) lines.push(digest.summary);
  if (topDo?.title) lines.push(`Do: ${topDo.title}`);
  if (topWatch?.signal) {
    lines.push(
      `Watch: ${topWatch.signal}${topWatch.nextPreventionStep ? ` -> ${topWatch.nextPreventionStep}` : ''}`
    );
  }
  if (messageType === 'important' && topWatch?.signal) {
    lines[0] = 'Important watch';
  }
  return lines.join('\n');
};

export const canSendGuidanceMessage = ({
  timeZone,
  preferences,
  deliveryCount,
  digest,
  question,
  force = false,
}: {
  timeZone: string;
  preferences?: GuidancePreferencesLike;
  deliveryCount: number;
  digest: GuidanceDigestLike;
  question: GuidanceQuestionLike | null;
  force?: boolean;
}) => {
  const prefs = preferences || {};
  if (prefs.telegramMode === 'off') return { allowed: false, reason: 'disabled' };
  if (!force && isWithinQuietHours(timeZone, prefs)) return { allowed: false, reason: 'quiet_hours' };
  const cap = typeof prefs.dailyTelegramLimit === 'number' ? prefs.dailyTelegramLimit : 2;
  if (!force && deliveryCount >= cap) return { allowed: false, reason: 'daily_cap' };
  const messageType = inferGuidanceMessageType(timeZone, digest, question, force);
  if (!messageType) return { allowed: false, reason: 'not_due' };
  return { allowed: true, messageType };
};

export const handleIncomingMessage = async (_update: TelegramUpdateLike) => {
  // The consolidated Telegram webhook still accepts message updates, but the
  // prior guidance-processing implementation is no longer present in this repo.
  // Keep the entrypoint stable while the broader Telegram flow is repaired.
  return { handled: false as const };
};
