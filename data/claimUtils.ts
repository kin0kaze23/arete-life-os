import { CategorizedFact, Claim, UserProfile } from './types';
import { contentHash } from '../shared/utils';

const normalize = (value?: string | number | null) =>
  typeof value === 'string' || typeof value === 'number' ? String(value).toLowerCase() : '';

const factMatchesProfile = (fact: CategorizedFact, profile: UserProfile) => {
  const text = normalize(fact.fact);
  const signals = [
    profile.identify.name,
    profile.identify.location,
    profile.personal.jobRole,
    profile.personal.company,
    profile.health.conditions?.[0],
    profile.spiritual.worldview,
  ]
    .map(normalize)
    .filter(Boolean);
  return signals.some((signal) => text.includes(signal));
};

const hasCorroboratingClaims = (fact: CategorizedFact, existingClaims: Claim[]) => {
  const target = contentHash(fact.fact);
  return existingClaims.some((claim) => contentHash(claim.fact) === target);
};

const hasConflictingClaims = (fact: CategorizedFact, existingClaims: Claim[]) => {
  const target = contentHash(fact.fact);
  return existingClaims.some(
    (claim) =>
      contentHash(claim.fact) === target &&
      (claim.fact.toLowerCase().includes('not') || claim.fact.toLowerCase().includes('no '))
  );
};

export const calculateClaimConfidence = (
  fact: CategorizedFact,
  profile: UserProfile,
  existingClaims: Claim[]
): number => {
  let confidence = 50;

  if (factMatchesProfile(fact, profile)) confidence += 20;
  if (hasCorroboratingClaims(fact, existingClaims)) confidence += 15;
  if (fact.sourceType && ['pdf', 'image'].includes(fact.sourceType)) confidence += 10;
  if (fact.eventDate) confidence += 5;
  if (hasConflictingClaims(fact, existingClaims)) confidence -= 10;

  return Math.max(0, Math.min(100, confidence));
};
