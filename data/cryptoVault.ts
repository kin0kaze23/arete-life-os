import type {
  DashboardPreferences,
  DimensionContextSnapshot,
  LifeContextSnapshot,
  LifeDimension,
} from './types';
import { Category } from './types';

const VAULT_KEY = 'aura_vault_v1';
const META_KEY = 'aura_vault_meta_v1';
const ITERATIONS = 200_000;

const LIFE_DIMENSIONS: LifeDimension[] = [
  Category.HEALTH,
  Category.FINANCE,
  Category.RELATIONSHIPS,
  Category.SPIRITUAL,
  Category.PERSONAL,
];

export type LifeContextVaultSlice = {
  lifeContextSnapshots: LifeContextSnapshot[];
  latestDimensionSnapshots: Partial<Record<LifeDimension, DimensionContextSnapshot>>;
  lastSessionScores: Partial<Record<LifeDimension, number>>;
  dashboardPreferences: DashboardPreferences;
};

export const createEmptyLifeContextVaultSlice = (): LifeContextVaultSlice => ({
  lifeContextSnapshots: [],
  latestDimensionSnapshots: {},
  lastSessionScores: {},
  dashboardPreferences: {
    isSnapshotExpanded: false,
    selectedDimension: Category.HEALTH,
    dismissedProfileGaps: {},
  },
});

export const normalizeLifeContextVaultSlice = (value: unknown): LifeContextVaultSlice => {
  const fallback = createEmptyLifeContextVaultSlice();
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Record<string, unknown>;
  const snapshots = Array.isArray(raw.lifeContextSnapshots)
    ? (raw.lifeContextSnapshots as LifeContextSnapshot[])
    : [];

  const latestRaw = raw.latestDimensionSnapshots;
  const latestDimensionSnapshots =
    latestRaw && typeof latestRaw === 'object'
      ? (latestRaw as Partial<Record<LifeDimension, DimensionContextSnapshot>>)
      : {};

  const scoresRaw = raw.lastSessionScores;
  const lastSessionScores: Partial<Record<LifeDimension, number>> = {};
  if (scoresRaw && typeof scoresRaw === 'object') {
    Object.entries(scoresRaw as Record<string, unknown>).forEach(([dimension, score]) => {
      if (LIFE_DIMENSIONS.includes(dimension as LifeDimension) && typeof score === 'number') {
        lastSessionScores[dimension as LifeDimension] = score;
      }
    });
  }

  const prefsRaw = raw.dashboardPreferences as Record<string, unknown> | undefined;
  const selectedDimension =
    prefsRaw && LIFE_DIMENSIONS.includes(prefsRaw.selectedDimension as LifeDimension)
      ? (prefsRaw.selectedDimension as LifeDimension)
      : fallback.dashboardPreferences.selectedDimension;
  const dismissedProfileGaps =
    prefsRaw?.dismissedProfileGaps && typeof prefsRaw.dismissedProfileGaps === 'object'
      ? Object.fromEntries(
          Object.entries(prefsRaw.dismissedProfileGaps as Record<string, unknown>).filter(
            ([, timestamp]) => typeof timestamp === 'number'
          )
        )
      : {};

  return {
    lifeContextSnapshots: snapshots,
    latestDimensionSnapshots,
    lastSessionScores,
    dashboardPreferences: {
      isSnapshotExpanded:
        prefsRaw && typeof prefsRaw.isSnapshotExpanded === 'boolean'
          ? prefsRaw.isSnapshotExpanded
          : fallback.dashboardPreferences.isSnapshotExpanded,
      selectedDimension,
      dismissedProfileGaps: dismissedProfileGaps as Record<string, number>,
    },
  };
};

type VaultMeta = {
  version: 1;
  salt: string;
  iterations: number;
};

type EncryptedPayload = {
  iv: string;
  data: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const fromBase64 = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const deriveKey = async (passphrase: string, salt: Uint8Array, iterations: number) => {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const encryptString = async (key: CryptoKey, plaintext: string): Promise<EncryptedPayload> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(cipher)) };
};

const decryptString = async (key: CryptoKey, payload: EncryptedPayload) => {
  const iv = fromBase64(payload.iv);
  const data = fromBase64(payload.data);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return decoder.decode(plain);
};

const getMeta = (): VaultMeta | null => {
  const raw = localStorage.getItem(META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VaultMeta;
  } catch {
    return null;
  }
};

export const hasVault = () => {
  return Boolean(localStorage.getItem(VAULT_KEY)) && Boolean(getMeta());
};

export const getVaultStorageUsage = () => {
  const vault = localStorage.getItem(VAULT_KEY) || '';
  const meta = localStorage.getItem(META_KEY) || '';
  return vault.length + meta.length;
};

export const createVault = async <T>(passphrase: string, data: T) => {
  if (!crypto?.subtle) throw new Error('Crypto unavailable');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt, ITERATIONS);
  const payload = await encryptString(key, JSON.stringify(data));
  const meta: VaultMeta = { version: 1, salt: toBase64(salt), iterations: ITERATIONS };
  localStorage.setItem(META_KEY, JSON.stringify(meta));
  localStorage.setItem(VAULT_KEY, JSON.stringify(payload));
  return key;
};

export const unlockVault = async <T>(passphrase: string) => {
  if (!crypto?.subtle) throw new Error('Crypto unavailable');
  const meta = getMeta();
  if (!meta) throw new Error('Missing vault metadata');
  const payloadRaw = localStorage.getItem(VAULT_KEY);
  if (!payloadRaw) throw new Error('Missing vault payload');
  const payload = JSON.parse(payloadRaw) as EncryptedPayload;
  const key = await deriveKey(passphrase, fromBase64(meta.salt), meta.iterations);
  const plaintext = await decryptString(key, payload);
  return { key, data: JSON.parse(plaintext) as T };
};

export const decryptVaultPayload = async <T>(
  passphrase: string,
  metaRaw: string,
  vaultRaw: string
) => {
  if (!crypto?.subtle) throw new Error('Crypto unavailable');
  const meta = JSON.parse(metaRaw) as VaultMeta;
  const payload = JSON.parse(vaultRaw) as EncryptedPayload;
  const key = await deriveKey(passphrase, fromBase64(meta.salt), meta.iterations);
  const plaintext = await decryptString(key, payload);
  return JSON.parse(plaintext) as T;
};

export const saveVault = async <T>(key: CryptoKey, data: T) => {
  const payload = await encryptString(key, JSON.stringify(data));
  localStorage.setItem(VAULT_KEY, JSON.stringify(payload));
};

export const clearVault = () => {
  localStorage.removeItem(VAULT_KEY);
  localStorage.removeItem(META_KEY);
};

export const importVault = (metaRaw: string, vaultRaw: string) => {
  localStorage.setItem(META_KEY, metaRaw);
  localStorage.setItem(VAULT_KEY, vaultRaw);
};

export const exportVault = () => {
  const meta = localStorage.getItem(META_KEY);
  const vault = localStorage.getItem(VAULT_KEY);
  if (!meta || !vault) return null;
  return { meta, vault };
};
