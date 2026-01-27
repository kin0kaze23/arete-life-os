export const parseNumber = (value: string): number | null => {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

export const contentHash = (content: string) =>
  content.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 120);
