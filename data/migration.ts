import { UserProfile, FamilySpace, UserRole, RelationshipType } from './types';

/**
 * Migrates a legacy single-user UserProfile (as defined in previous versions)
 * into a modern multi-user FamilySpace container.
 *
 * @param oldProfile The existing UserProfile from localStorage/state
 * @returns A fresh FamilySpace containing the upgraded profile as the initial Admin
 */
export function migrateSingleUserToFamily(oldProfile: any): FamilySpace {
  const userId = oldProfile.id || `user-${Date.now()}`;

  const upgradedProfile: UserProfile = {
    ...oldProfile,
    id: userId,
    role: UserRole.ADMIN,
    privacySettings: {
      viewFinance: true,
      viewHealth: true,
      viewSpiritual: true,
      viewRelationships: true,
    },
    relationships: [], // Initial state has no connections
    innerCircle: oldProfile.innerCircle || [],
  };

  const familySpace: FamilySpace = {
    id: `family-${Date.now()}`,
    familyName: `${oldProfile.identify?.name || 'My'}'s Family Unit`,
    members: [upgradedProfile],
    sharedResources: {
      vaultId: `vault-${Date.now()}`,
    },
  };

  return familySpace;
}

/**
 * Generic helper to migrate domain entities (Tasks, Goals, Memories)
 * into the multi-user ownership model.
 */
export function migrateEntitiesToMultiUser<T extends { id: string }>(
  entities: T[],
  ownerId: string | 'FAMILY_SHARED'
): (T & { ownerId: string | 'FAMILY_SHARED'; createdAt: number })[] {
  return entities.map((e) => ({
    ...e,
    ownerId,
    createdAt: (e as any).createdAt || Date.now(),
  }));
}
