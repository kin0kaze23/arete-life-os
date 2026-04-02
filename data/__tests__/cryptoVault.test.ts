import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearVault,
  createVault,
  decryptVaultPayload,
  saveVault,
  unlockVault,
} from '../cryptoVault';

describe('cryptoVault', () => {
  const passphrase = 'test-passphrase-123!';
  const data = { message: 'hello', count: 42 };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates and unlocks an encrypted vault', async () => {
    await createVault(passphrase, data);

    const unlocked = await unlockVault<typeof data>(passphrase);

    expect(unlocked.data).toEqual(data);
  });

  it('decrypts stored payloads for test verification', async () => {
    await createVault(passphrase, data);

    const vaultRaw = localStorage.getItem('aura_vault_v1');
    const metaRaw = localStorage.getItem('aura_vault_meta_v1');

    const decrypted = await decryptVaultPayload<typeof data>(passphrase, metaRaw!, vaultRaw!);

    expect(decrypted).toEqual(data);
  });

  it('persists updated data', async () => {
    const unlocked = await createVault(passphrase, data).then(() =>
      unlockVault<typeof data>(passphrase)
    );
    const updated = { ...data, message: 'updated' };

    await saveVault(unlocked.key as CryptoKey, updated);

    const vaultRaw = localStorage.getItem('aura_vault_v1');
    const metaRaw = localStorage.getItem('aura_vault_meta_v1');

    const decrypted = await decryptVaultPayload<typeof updated>(passphrase, metaRaw!, vaultRaw!);

    expect(decrypted).toEqual(updated);
  });

  it('clears stored vault data', async () => {
    await createVault(passphrase, data);

    clearVault();

    expect(localStorage.getItem('aura_vault_v1')).toBeNull();
    expect(localStorage.getItem('aura_vault_meta_v1')).toBeNull();
  });
});
