import React, { useState, useMemo } from 'react';

type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
};

const checkPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'text-rose-400' };
  if (score === 2) return { score: 2, label: 'Fair', color: 'text-amber-400' };
  if (score === 3) return { score: 3, label: 'Good', color: 'text-yellow-400' };
  return { score: 4, label: 'Strong', color: 'text-emerald-400' };
};

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

  const strength = useMemo(() => checkPasswordStrength(passphrase), [passphrase]);

  const handleSubmit = async () => {
    setLocalError(null);
    if (!passphrase) {
      setLocalError('Passphrase is required.');
      return;
    }
    if (!hasVault && passphrase.length < 8) {
      setLocalError('Passphrase must be at least 8 characters.');
      return;
    }
    if (!hasVault && strength.score < 2) {
      setLocalError(
        'Please choose a stronger passphrase. Try mixing uppercase, lowercase, numbers, and symbols.'
      );
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
            {!hasVault && passphrase && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      strength.score === 1
                        ? 'bg-rose-500 w-1/4'
                        : strength.score === 2
                          ? 'bg-amber-500 w-2/4'
                          : strength.score === 3
                            ? 'bg-yellow-500 w-3/4'
                            : 'bg-emerald-500 w-full'
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-medium ${strength.color}`}>
                  {strength.label}
                </span>
              </div>
            )}
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
