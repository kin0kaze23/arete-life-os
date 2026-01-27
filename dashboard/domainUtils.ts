import { Category, MemoryEntry, Source, UserProfile } from '@/data';

const isFilled = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return Boolean(value);
};

export const getProfileCoverage = (profile: UserProfile, pillarId: string) => {
  const profileFieldSets: Record<string, unknown[]> = {
    health: [
      profile.health.height,
      profile.health.weight,
      profile.health.sleepTime,
      profile.health.wakeTime,
      profile.health.activities,
      profile.health.activityFrequency,
      profile.health.conditions,
      profile.health.medications,
    ],
    finance: [
      profile.finances.assetsTotal,
      profile.finances.assetsBreakdown.cash,
      profile.finances.assetsBreakdown.investments,
      profile.finances.assetsBreakdown.property,
      profile.finances.assetsBreakdown.other,
      profile.finances.liabilities,
      profile.finances.income,
      profile.finances.fixedCosts,
      profile.finances.variableCosts,
    ],
    personal: [
      profile.identify.name,
      profile.identify.location,
      profile.identify.origin,
      profile.personal.status,
      profile.personal.jobRole,
      profile.personal.company,
      profile.personal.interests,
    ],
    relationships: [
      profile.relationship.livingArrangement,
      profile.relationship.socialEnergy,
      profile.relationship.dailyCommitments,
      profile.relationship.socialGoals,
      profile.innerCircle,
    ],
    spiritual: [
      profile.spiritual.worldview,
      profile.spiritual.coreValues,
      profile.spiritual.practicePulse,
    ],
  };
  const fields = profileFieldSets[pillarId] || [];
  const filled = fields.filter(isFilled).length;
  return fields.length === 0 ? 0 : Math.round((filled / fields.length) * 100);
};

export const getPillarMemory = (memory: MemoryEntry[], categories: Category[]) =>
  memory.filter((item) => categories.includes(item.category));

export const getPillarSourceCount = (
  memory: MemoryEntry[],
  sources: Source[],
  categories: Category[]
) => {
  const knownSources = new Set(sources.map((s) => s.id));
  const sourceIds = new Set(
    getPillarMemory(memory, categories)
      .map((item) => item.sourceId)
      .filter((id): id is string => Boolean(id) && knownSources.has(id))
  );
  return sourceIds.size;
};

export const getPillarSources = (
  memory: MemoryEntry[],
  sources: Source[],
  categories: Category[]
) => {
  const sourceIds = new Set(
    getPillarMemory(memory, categories)
      .map((item) => item.sourceId)
      .filter((id): id is string => Boolean(id))
  );
  return sources.filter((s) => sourceIds.has(s.id));
};

export const getLatestSignal = (memory: MemoryEntry[], categories: Category[]) => {
  const items = getPillarMemory(memory, categories);
  if (items.length === 0) return null;
  return items.reduce((latest, item) => (item.timestamp > latest ? item.timestamp : latest), 0);
};

export const getCoverageScore = (
  profile: UserProfile,
  memory: MemoryEntry[],
  sources: Source[],
  pillarId: string,
  categories: Category[]
) => {
  const profileScore = getProfileCoverage(profile, pillarId);
  const pillarMemory = getPillarMemory(memory, categories);
  const memoryCount = pillarMemory.length;
  const fileCount = getPillarSourceCount(memory, sources, categories);

  const now = Date.now();
  const decayDays = 30;
  const weightedMemoryCount = pillarMemory.reduce((sum, item) => {
    const daysOld = (now - item.timestamp) / (1000 * 60 * 60 * 24);
    const decay = Math.max(0.1, 1 - daysOld / decayDays);
    return sum + decay;
  }, 0);

  const signalScore = Math.min(40, weightedMemoryCount * 2 + fileCount * 6);
  return {
    total: Math.min(100, Math.round(profileScore * 0.6 + signalScore)),
    profileScore,
    memoryCount,
    fileCount,
    freshness: memoryCount > 0 ? weightedMemoryCount / memoryCount : 0,
  };
};

export const formatSignalTime = (timestamp: number | null) => {
  if (!timestamp) return 'No signals yet';
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 48) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};
