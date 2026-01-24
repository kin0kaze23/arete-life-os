import React, { useState } from 'react';

type VaultLockViewProps = {
  hasVault: boolean;
  hasLegacyData: boolean;
  lockError: string | null;
  onUnlock: (passphrase: string) => Promise<void>;
  onSetup: (passphrase: string) => Promise<void>;
};

export const VaultLockView: React.FC<VaultLockViewProps> = ({
  hasVault,
  hasLegacyData,
  lockError,
  onUnlock,
  onSetup,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setLocalError(null);
    if (!passphrase) {
      setLocalError('Passphrase is required.');
      return;
    }
    if (!hasVault && passphrase !== confirm) {
      setLocalError('Passphrases do not match.');
      return;
    }
    setIsSubmitting(true);
    if (hasVault) {
      await onUnlock(passphrase);
    } else {
      await onSetup(passphrase);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[#0D1117] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          {hasVault ? 'Unlock Secure Vault' : 'Create Secure Vault'}
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          {hasVault
            ? 'Enter your passphrase to decrypt your data.'
            : 'Set a passphrase to encrypt your local data.'}
        </p>

        {hasLegacyData && !hasVault && (
          <div className="mb-4 text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            Existing local data was found. It will be encrypted when you set your passphrase.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              Passphrase
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="Enter passphrase"
            />
          </div>

          {!hasVault && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                Confirm Passphrase
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="Confirm passphrase"
              />
            </div>
          )}
        </div>

        {(localError || lockError) && (
          <div className="mt-4 text-[11px] text-rose-200 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
            {localError || lockError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-widest disabled:opacity-60"
        >
          {isSubmitting ? 'Working...' : hasVault ? 'Unlock' : 'Create Vault'}
        </button>

        <p className="mt-4 text-[10px] text-slate-500">
          If you forget this passphrase, your data cannot be recovered.
        </p>
      </div>
    </div>
  );
};
