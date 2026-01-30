import React, { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, Cpu, Database, ChevronRight } from 'lucide-react';

interface InitWizardProps {
  onComplete: () => void;
  username?: string;
}

export const InitWizard: React.FC<InitWizardProps> = ({ onComplete, username }) => {
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const bootSequence = [
    'Initializing secure kernel...',
    'Mounting file system (ZFS Encrypted)...',
    'Verifying identity signatures...',
    'Loading neural modules...',
    'Establish connection to local daemon...',
    'ACCESS GRANTED.',
  ];

  useEffect(() => {
    let delay = 0;
    bootSequence.forEach((log, index) => {
      delay += Math.random() * 500 + 200;
      setTimeout(() => {
        setLogs((prev) => [...prev, log]);
        if (index === bootSequence.length - 1) {
          setTimeout(() => setStep(1), 800);
        }
      }, delay);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#030405] text-indigo-500 font-mono flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-indigo-500/30 rounded-lg bg-black/50 p-6 shadow-[0_0_50px_rgba(79,70,229,0.1)] relative overflow-hidden text-sm">
        {/* Scanline */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent animate-scan pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-indigo-500/30 pb-4">
          <Terminal size={18} />
          <h1 className="font-bold tracking-widest text-indigo-400">VAULT.EXE</h1>
          <div className="ml-auto flex gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-indigo-500/50" />
            <div className="w-2 h-2 rounded-full bg-indigo-500/20" />
          </div>
        </div>

        {/* Console Content */}
        <div className="h-64 flex flex-col justify-end gap-1 mb-6 font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
              <span
                className={
                  i === logs.length - 1 ? 'text-indigo-300 animate-pulse' : 'text-indigo-500/70'
                }
              >
                {log}
              </span>
            </div>
          ))}
          {step < 1 && <div className="animate-pulse">_</div>}
        </div>

        {/* Action Area */}
        {step >= 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-4 mb-4 flex items-center gap-4">
              <ShieldCheck size={24} className="text-emerald-400" />
              <div>
                <h3 className="text-white font-bold">Identity Verified</h3>
                <p className="text-slate-400 text-xs">Welcome back, {username || 'Operator'}.</p>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 group transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
            >
              ENTER CONSOLE{' '}
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
