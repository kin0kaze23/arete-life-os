import React, { useState } from 'react';
import { Sparkles, ArrowRight, RefreshCcw } from 'lucide-react';

type VaultLockViewProps = {
  hasVault: boolean;
  hasLegacyData: boolean;
  lockError: string | null;
  onUnlock: (passphrase: string) => Promise<void>;
  onSetup: (passphrase: string) => Promise<void>;
};

export const VaultLockView: React.FC<VaultLockViewProps> = ({
  hasVault,
  lockError,
  onUnlock,
  onSetup,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passphrase) return;

    setIsSubmitting(true);
    try {
      if (hasVault) {
        await onUnlock(passphrase);
      } else {
        await onSetup(passphrase);
      }
    } catch {
      // The error is handled via lockError prop usually
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetVault = () => {
    // A real reset would clear indexedDB. Since we're doing UI iteration,
    // we'll instruct the user on how to clear it if they get stuck.
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10 space-y-5">
          {/* Arete "A" mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 mb-2 shadow-2xl backdrop-blur-xl mx-auto">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              className="w-8 h-8"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 34L18 8" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M32 34L22 8" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <path
                d="M13 24H27"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeOpacity="0.6"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
            {hasVault ? 'Welcome back' : 'Secure your life'}
          </h1>
          <p className="text-white/40 text-sm font-medium">
            {hasVault ? 'Your Life Pulse is waiting' : 'Create your local encryption key'}
          </p>

          {/* 5 dimension dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {[
              'var(--dim-health)',
              'var(--dim-finance)',
              'var(--dim-relationships)',
              'var(--dim-spiritual)',
              'var(--dim-personal)',
            ].map((color, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full opacity-60 animate-pulse"
                style={{ background: color, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Your Access Key"
              className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/20 rounded-2xl px-6 py-5 focus:outline-none focus:border-white/40 focus:bg-white/[0.06] transition-all text-center text-lg text-white placeholder-white/20 font-medium tracking-widest shadow-2xl backdrop-blur-xl outline-none"
              autoFocus
            />

            <button
              type="submit"
              disabled={isSubmitting || !passphrase}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-3.5 rounded-xl transition-all shadow-lg ${
                passphrase
                  ? 'bg-white text-[#02040a] hover:scale-105 active:scale-95'
                  : 'bg-white/5 text-white/20'
              }`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {lockError && (
            <div className="text-center text-rose-400 text-xs font-semibold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
              Incorrect Key. Please Try Again.
            </div>
          )}

          {!hasVault && (
            <div className="text-center space-y-2 px-4 pt-2">
              <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-black">
                Local-First Privacy
              </p>
              <p className="text-xs text-white/40 leading-relaxed">
                Your key encrypts all your data locally. <br /> Make sure it's something you'll
                remember.
              </p>
            </div>
          )}

          {hasVault && (
            <div className="pt-10 flex flex-col items-center gap-4">
              {showResetConfirm ? (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center space-y-4 backdrop-blur-md animate-in zoom-in-95 duration-300">
                  <p className="text-xs text-rose-200/80 font-medium">
                    This will permanently delete all local data.
                  </p>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResetVault}
                      className="text-[10px] uppercase font-black tracking-widest bg-rose-500 text-white px-5 py-2.5 rounded-lg shadow-xl hover:bg-rose-400 transition-colors"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-[10px] uppercase tracking-[0.2em] font-black text-white/20 hover:text-white/50 transition-all flex items-center gap-2 group"
                >
                  <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                  Forgot Key? Reset App
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Decorative footer text */}
      <div className="absolute bottom-10 left-0 w-full text-center">
        <p className="text-[10px] text-white/[0.05] font-black uppercase tracking-[0.5em]">
          Arete OS / Local Vault
        </p>
      </div>
    </div>
  );
};
