import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Clock } from 'lucide-react';

// Rate limiting constants
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_BACKOFF_MS = [30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000];
const STORAGE_KEY = 'vault_lockout';
const MIN_PASSPHRASE_LENGTH = 10;

type LockoutState = {
  failedAttempts: number;
  lockoutUntil: number | null;
  lockoutLevel: number;
};

const getLockoutState = (): LockoutState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { failedAttempts: 0, lockoutUntil: null, lockoutLevel: 0 };
};

const saveLockoutState = (state: LockoutState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const clearLockoutState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  warnings: string[];
  blocked: boolean;
};

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'letmein',
  'admin',
  'welcome',
  'iloveyou',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'abc123',
  'passw0rd',
  'master',
]);

const hasSequentialPattern = (value: string) =>
  /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|qwerty|asdf|zxcv)/i.test(value);

const hasRepeatedChars = (value: string) => /(.)\1{2,}/.test(value);

const checkPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { score: 0, label: '', color: '', warnings: [], blocked: false };

  const normalized = password.toLowerCase().trim();
  const warnings: string[] = [];
  const blocked = COMMON_PASSWORDS.has(normalized);
  if (blocked) warnings.push('Common password');
  if (hasSequentialPattern(password)) warnings.push('Sequential pattern');
  if (hasRepeatedChars(password)) warnings.push('Repeated characters');

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (warnings.length > 0) score = Math.max(1, score - 1);

  if (score <= 1) return { score: 1, label: 'Weak', color: 'text-rose-400', warnings, blocked };
  if (score === 2) return { score: 2, label: 'Fair', color: 'text-amber-400', warnings, blocked };
  if (score === 3) return { score: 3, label: 'Good', color: 'text-yellow-400', warnings, blocked };
  return { score: 4, label: 'Strong', color: 'text-emerald-400', warnings, blocked };
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
  const [lockoutState, setLockoutState] = useState<LockoutState>(getLockoutState);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const strength = useMemo(() => checkPasswordStrength(passphrase), [passphrase]);

  // Check if currently locked out
  const isLockedOut = useMemo(() => {
    if (!lockoutState.lockoutUntil) return false;
    return Date.now() < lockoutState.lockoutUntil;
  }, [lockoutState.lockoutUntil, remainingSeconds]);

  // Update countdown timer
  useEffect(() => {
    if (!lockoutState.lockoutUntil) return;

    const updateRemaining = () => {
      const remaining = Math.max(0, lockoutState.lockoutUntil! - Date.now());
      setRemainingSeconds(Math.ceil(remaining / 1000));

      // Clear lockout when time expires
      if (remaining <= 0) {
        const newState = { ...lockoutState, lockoutUntil: null };
        setLockoutState(newState);
        saveLockoutState(newState);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [lockoutState.lockoutUntil]);

  const formatRemainingTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleUnlockAttempt = useCallback(
    async (pass: string) => {
      try {
        await onUnlock(pass);
        // Success - clear lockout state
        clearLockoutState();
        setLockoutState({ failedAttempts: 0, lockoutUntil: null, lockoutLevel: 0 });
      } catch {
        // Failed attempt
        const newAttempts = lockoutState.failedAttempts + 1;
        let lockoutLevel = lockoutState.lockoutLevel;
        let lockoutUntil: number | null = null;
        let attempts = newAttempts;
        if (newAttempts >= LOCKOUT_THRESHOLD) {
          lockoutLevel = Math.min(lockoutLevel + 1, LOCKOUT_BACKOFF_MS.length - 1);
          lockoutUntil = Date.now() + LOCKOUT_BACKOFF_MS[lockoutLevel];
          attempts = 0;
        }
        const newState: LockoutState = {
          failedAttempts: attempts,
          lockoutUntil,
          lockoutLevel,
        };
        setLockoutState(newState);
        saveLockoutState(newState);

        if (lockoutUntil) {
          const minutes = Math.ceil(LOCKOUT_BACKOFF_MS[lockoutLevel] / 60000);
          setLocalError(`Too many failed attempts. Vault locked for ${minutes} minutes.`);
        }
      }
    },
    [onUnlock, lockoutState.failedAttempts, lockoutState.lockoutLevel]
  );

  const handleSubmit = async () => {
    setLocalError(null);

    // Check lockout
    if (isLockedOut) {
      setLocalError(`Please wait ${formatRemainingTime(remainingSeconds)} before trying again.`);
      return;
    }

    if (!passphrase) {
      setLocalError('Passphrase is required.');
      return;
    }
    if (!hasVault && passphrase.length < MIN_PASSPHRASE_LENGTH && strength.score < 3) {
      setLocalError(`Passphrase should be at least ${MIN_PASSPHRASE_LENGTH} characters.`);
      return;
    }
    if (!hasVault && strength.blocked) {
      setLocalError('This passphrase is too common. Please choose a more unique phrase.');
      return;
    }
    if (!hasVault && strength.score < 2) {
      setLocalError('Please choose a stronger passphrase.');
      return;
    }
    if (!hasVault && passphrase !== confirm) {
      setLocalError('Passphrases do not match.');
      return;
    }

    setIsSubmitting(true);
    if (hasVault) {
      await handleUnlockAttempt(passphrase);
    } else {
      await onSetup(passphrase);
    }
    setIsSubmitting(false);
  };

  const attemptsRemaining = LOCKOUT_THRESHOLD - lockoutState.failedAttempts;

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[#0D1117] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-indigo-500" size={28} />
          <h1 className="text-2xl font-black tracking-tight text-white">
            {hasVault ? 'Unlock Secure Vault' : 'Create Secure Vault'}
          </h1>
        </div>
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

        {/* Lockout warning */}
        {isLockedOut && (
          <div className="mb-4 text-[11px] text-rose-200 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} />
              <span className="font-bold">Account Temporarily Locked</span>
            </div>
            <p>Too many failed attempts. Please wait before trying again.</p>
            <div className="mt-3 flex items-center gap-2 text-rose-300">
              <Clock size={14} />
              <span className="font-mono text-sm">{formatRemainingTime(remainingSeconds)}</span>
            </div>
          </div>
        )}

        {/* Attempts warning (show when close to lockout) */}
        {hasVault && !isLockedOut && lockoutState.failedAttempts > 0 && attemptsRemaining <= 3 && (
          <div className="mb-4 text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before
              lockout
            </span>
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
              disabled={isLockedOut}
              className="w-full bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter passphrase"
              onKeyDown={(e) => e.key === 'Enter' && !isLockedOut && handleSubmit()}
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
            {!hasVault && strength.warnings.length > 0 && (
              <div className="mt-2 text-[10px] text-amber-300">{strength.warnings.join(' • ')}</div>
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
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}
        </div>

        {(localError || lockError) && !isLockedOut && (
          <div className="mt-4 text-[11px] text-rose-200 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
            {localError || lockError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isLockedOut}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting
            ? 'Working...'
            : isLockedOut
              ? 'Locked'
              : hasVault
                ? 'Unlock'
                : 'Create Vault'}
        </button>

        <p className="mt-4 text-[10px] text-slate-500">
          If you forget this passphrase, your data cannot be recovered.
        </p>

        {/* Security info */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest">
            🔒 AES-256-GCM encryption • 200,000 PBKDF2 iterations (new vaults) • Zero-knowledge
          </p>
        </div>
      </div>
    </div>
  );
};
