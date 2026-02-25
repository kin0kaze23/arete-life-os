import { requireSupabase } from './supabaseClient';
import { syncVaultSnapshotToSupabase, type CloudVaultSnapshot } from './supabaseVault';

const readLocalVaultMeta = (): { salt: string; iterations: number } | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('aura_vault_meta_v1');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { salt?: string; iterations?: number };
    if (!parsed?.salt || typeof parsed.iterations !== 'number') return null;
    return { salt: parsed.salt, iterations: parsed.iterations };
  } catch {
    return null;
  }
};

export const migrateLocalVaultToSupabase = async (
  vaultKey: CryptoKey,
  userId: string,
  snapshot: CloudVaultSnapshot
): Promise<{ migrated: number; errors: number }> => {
  const supabase = requireSupabase();

  await syncVaultSnapshotToSupabase(userId, vaultKey, snapshot, 'import');

  const meta = readLocalVaultMeta();
  const fallbackSalt = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  const fallbackIterations = 100_000;

  const { error } = await (supabase as any).from('user_profiles').upsert({
    id: userId,
    display_name:
      snapshot.familySpace.members.find((m) => m.id === snapshot.activeUserId)?.identify?.name ||
      'Me',
    vault_salt: meta?.salt || fallbackSalt,
    vault_iterations: meta?.iterations || fallbackIterations,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to upsert user profile during migration: ${error.message}`);
  }

  const migratedCount =
    snapshot.memoryItems.length +
    snapshot.claims.length +
    snapshot.tasks.length +
    snapshot.timelineEvents.length +
    snapshot.goals.length +
    snapshot.recommendations.length +
    snapshot.blindSpots.length +
    2;

  return {
    migrated: migratedCount,
    errors: 0,
  };
};
