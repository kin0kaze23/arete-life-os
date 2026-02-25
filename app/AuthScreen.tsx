import React, { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onSendMagicLink: (email: string) => Promise<void>;
  authError?: string | null;
  isSending?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSendMagicLink,
  authError,
  isSending = false,
}) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await onSendMagicLink(email.trim());
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
            <Mail size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold">Areté Auth</p>
            <h1 className="text-xl font-black">Sign in with magic link</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={isSending}
            className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition"
          >
            {isSending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Sending...
              </span>
            ) : (
              'Send magic link'
            )}
          </button>
        </form>

        {sent && !authError && (
          <p className="mt-4 text-xs text-emerald-300">
            Check your email and open the magic link on this device.
          </p>
        )}
        {authError && <p className="mt-4 text-xs text-rose-300">{authError}</p>}
      </div>
    </div>
  );
};
