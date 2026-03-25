const BACKUP_ID_KEY = 'aura_backup_identity_v1';
const BACKUP_META_KEY = 'aura_backup_meta_v1';
const DEVICE_ID_KEY = 'aura_device_id_v1';
const RESTORE_BACKOFF_KEY = 'aura_backup_restore_backoff_v1';

const BACKUP_SALT = 'arete-backup-v1';
const BACKUP_DERIVE_ITERATIONS = 50_000;

const RESTORE_BACKOFF_MS = [30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000];

export type BackupMeta = {
  createdAt: string;
  lastBackupAt?: string;
  lastBackupKey?: string;
  lastBackupSizeBytes?: number;
};

type RestoreBackoffState = {
  failures: number;
  nextAllowedAt: number | null;
};

const encoder = new TextEncoder();

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const normalizeHex = (value: string) => value.toLowerCase().replace(/[^a-f0-9]/g, '');

export const generateRecoveryCode = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = toHex(bytes);
  return hex.match(/.{1,4}/g)?.join('-') || hex;
};

export const normalizeRecoveryCode = (input: string) => normalizeHex(input);

export const deriveBackupIdentity = async (passphrase: string, recoveryCode: string) => {
  if (!crypto?.subtle) throw new Error('Crypto unavailable');
  const normalized = normalizeRecoveryCode(recoveryCode);
  if (!normalized) throw new Error('Recovery code required');
  const material = `${passphrase}:${normalized}`;
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(material),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(BACKUP_SALT),
      iterations: BACKUP_DERIVE_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );
  return toHex(new Uint8Array(bits));
};

const ensureLocalStorage = () => (typeof localStorage !== 'undefined' ? localStorage : null);

export const getBackupIdentity = () => {
  const store = ensureLocalStorage();
  return store?.getItem(BACKUP_ID_KEY) || null;
};

export const setBackupIdentity = (identity: string) => {
  const store = ensureLocalStorage();
  store?.setItem(BACKUP_ID_KEY, identity);
};

export const clearBackupIdentity = () => {
  const store = ensureLocalStorage();
  store?.removeItem(BACKUP_ID_KEY);
};

export const getBackupMeta = (): BackupMeta | null => {
  const store = ensureLocalStorage();
  if (!store) return null;
  const raw = store.getItem(BACKUP_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BackupMeta;
  } catch {
    return null;
  }
};

export const setBackupMeta = (meta: BackupMeta) => {
  const store = ensureLocalStorage();
  store?.setItem(BACKUP_META_KEY, JSON.stringify(meta));
};

export const getDeviceId = () => {
  const store = ensureLocalStorage();
  if (!store) return 'unknown-device';
  const existing = store.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const deviceId = toHex(bytes);
  store.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
};

export const getRestoreBackoffState = (): RestoreBackoffState => {
  const store = ensureLocalStorage();
  if (!store) return { failures: 0, nextAllowedAt: null };
  const raw = store.getItem(RESTORE_BACKOFF_KEY);
  if (!raw) return { failures: 0, nextAllowedAt: null };
  try {
    const parsed = JSON.parse(raw) as RestoreBackoffState;
    return parsed;
  } catch {
    return { failures: 0, nextAllowedAt: null };
  }
};

export const recordRestoreFailure = () => {
  const state = getRestoreBackoffState();
  const nextFailures = state.failures + 1;
  const backoffIndex = Math.min(nextFailures - 1, RESTORE_BACKOFF_MS.length - 1);
  const nextAllowedAt = Date.now() + RESTORE_BACKOFF_MS[backoffIndex];
  const store = ensureLocalStorage();
  store?.setItem(RESTORE_BACKOFF_KEY, JSON.stringify({ failures: nextFailures, nextAllowedAt }));
  return { failures: nextFailures, nextAllowedAt };
};

export const clearRestoreBackoff = () => {
  const store = ensureLocalStorage();
  store?.removeItem(RESTORE_BACKOFF_KEY);
};
