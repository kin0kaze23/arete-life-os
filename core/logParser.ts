import { Category } from '@/data/types';

type DeterministicParseInput = {
  ownerId: string;
  currentDate: string;
};

type DeterministicParseResult = {
  confidence: number;
  intent: string;
  items: Array<Record<string, unknown>>;
  facts: Array<Record<string, unknown>>;
  proposedUpdates: Array<Record<string, unknown>>;
};

const EXPENSE_AMOUNT_REGEX = /(?:\$|sgd\s?|usd\s?)(\d{1,6}(?:[.,]\d{1,2})?)/i;
const EXPENSE_VERB_REGEX = /\b(spent|paid|cost|total|bill|spent about)\b/i;
const BLOCKED_INTENT_REGEX = /\b(need to|should|tomorrow|next|follow up|remind|schedule)\b/i;

const normalizeAmount = (raw: string): number | null => {
  const cleaned = raw.replace(/,/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
};

const extractLocation = (text: string): string | null => {
  const match = text.match(/\bat\s+([^,.]+)/i);
  if (!match) return null;
  const location = match[1].trim();
  return location.length > 0 ? location : null;
};

const extractSplitCount = (text: string): number | null => {
  const match =
    text.match(/\bsplit\s+by\s+(\d{1,2})\b/i) || text.match(/\bsplit\s+among\s+(\d{1,2})\b/i);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) && value > 0 ? value : null;
};

export const parseLogDeterministically = (
  input: string,
  meta: DeterministicParseInput
): DeterministicParseResult | null => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  const hasExpenseVerb = EXPENSE_VERB_REGEX.test(trimmed);
  const amountMatch = trimmed.match(EXPENSE_AMOUNT_REGEX);
  if (!hasExpenseVerb || !amountMatch) return null;
  if (BLOCKED_INTENT_REGEX.test(trimmed)) return null;

  const amount = normalizeAmount(amountMatch[1]);
  if (amount === null) return null;

  const location = extractLocation(trimmed);
  const splitCount = extractSplitCount(trimmed);
  const perPersonAmount =
    splitCount && splitCount > 0 ? Number((amount / splitCount).toFixed(2)) : null;

  const fields: Record<string, unknown> = {
    amount,
    currency: trimmed.includes('$') ? 'USD' : 'SGD',
  };
  if (location) fields.location = location;
  if (splitCount) fields.splitCount = splitCount;
  if (perPersonAmount) fields.perPersonAmount = perPersonAmount;

  const confidence = 0.86;

  return {
    confidence,
    intent: 'finance',
    items: [
      {
        type: 'finance_record',
        intent: 'finance',
        domain: Category.FINANCE,
        ownerId: meta.ownerId,
        horizon: 'now',
        title: 'Expense',
        content: trimmed,
        confidence,
        tags: ['expense'],
        fields,
      },
    ],
    facts: [
      {
        fact: location ? `Spent ${amount} at ${location}` : `Spent ${amount} on an expense`,
        category: Category.FINANCE,
        confidence,
        ownerId: meta.ownerId,
        eventDate: meta.currentDate,
        sourceType: 'text',
      },
    ],
    proposedUpdates: [],
  };
};
