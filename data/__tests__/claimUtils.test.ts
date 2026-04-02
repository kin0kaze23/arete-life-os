import { describe, expect, it } from 'vitest';
import type { CategorizedFact, Claim, UserProfile } from '../types';
import { Category, ClaimStatus } from '../types';
import { calculateClaimConfidence } from '../claimUtils';

describe('claimUtils', () => {
  const profile: UserProfile = {
    identify: {
      name: 'John Doe',
      birthday: '',
      location: 'San Francisco',
      origin: '',
      ethnicity: '',
    },
    personal: {
      jobRole: 'Software Engineer',
      company: 'TechCorp',
      interests: [],
    },
    health: {
      height: '',
      weight: '',
      sleepTime: '',
      wakeTime: '',
      activities: [],
      activityFrequency: '',
      conditions: ['Asthma'],
      medications: [],
    },
    finances: {
      assetsTotal: '',
      assetsBreakdown: { cash: '', investments: '', property: '', other: '' },
      liabilities: '',
      income: '',
      fixedCosts: '',
      variableCosts: '',
    },
    relationship: {
      relationshipStatus: 'Single',
      livingArrangement: '',
      socialEnergy: '',
      dailyCommitments: [],
      socialGoals: [],
    },
    spiritual: {
      worldview: 'Humanist',
      coreValues: [],
      practicePulse: '',
    },
    innerCircle: [],
    id: 'user-1',
    role: 'MEMBER' as UserProfile['role'],
    privacySettings: {
      viewFinance: true,
      viewHealth: true,
      viewSpiritual: true,
      viewRelationships: true,
    },
    relationships: [],
    lastSyncTimestamp: Date.now(),
    coherenceScore: 100,
  };

  it('returns a bounded confidence score', () => {
    const fact: CategorizedFact = {
      fact: 'User works in technology',
      category: Category.WORK,
      confidence: 0.8,
    };

    const confidence = calculateClaimConfidence(fact, profile, []);

    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it('raises confidence when a fact matches the profile', () => {
    const fact: CategorizedFact = {
      fact: 'John Doe works as a Software Engineer',
      category: Category.WORK,
      confidence: 0.8,
    };

    expect(calculateClaimConfidence(fact, profile, [])).toBeGreaterThan(50);
  });

  it('raises confidence when corroborating claims exist', () => {
    const fact: CategorizedFact = {
      fact: 'User exercises regularly',
      category: Category.HEALTH,
      confidence: 0.8,
    };

    const claims: Claim[] = [
      {
        id: 'claim-1',
        sourceId: 'source-1',
        fact: 'User exercises regularly',
        type: 'FACT',
        confidence: 80,
        status: ClaimStatus.COMMITTED,
        category: Category.HEALTH,
        ownerId: 'user-1',
        timestamp: Date.now(),
      },
    ];

    expect(calculateClaimConfidence(fact, profile, claims)).toBeGreaterThan(50);
  });
});
