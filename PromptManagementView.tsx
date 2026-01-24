import React from 'react';
import { PromptConfig } from './types';
import { Terminal, Save, RotateCcw, HelpCircle, Code } from 'lucide-react';

interface PromptManagementViewProps {
  prompts: PromptConfig[];
  updatePrompt: (id: string, newTemplate: string) => void;
  resetPrompt: (id: string) => void;
}

export const PromptManagementView: React.FC<PromptManagementViewProps> = ({
  prompts,
  updatePrompt,
  resetPrompt,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col gap-2">
        <h3 className="text-3xl font-bold flex items-center gap-3">
          <Terminal className="text-indigo-600" />
          Aura Command Hub
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Refine the system prompts that drive Aura's cognition. Changes take effect immediately
          across all sessions.
        </p>
      </div>

      <div className="space-y-8">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-white dark:bg-slate-800 rounded-[2.5rem] border dark:border-slate-700 p-8 shadow-sm space-y-6 transition-all group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Code size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold">{prompt.name}</h4>
                  <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                    {prompt.id} ENGINE
                  </p>
                </div>
              </div>
              <button
                onClick={() => resetPrompt(prompt.id)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <RotateCcw size={14} /> Reset to Default
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border dark:border-slate-800 flex items-start gap-4">
              <div className="mt-1 text-slate-300">
                <HelpCircle size={18} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                {prompt.purpose}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                System Instructions Template
              </label>
              <textarea
                value={prompt.template || prompt.defaultTemplate}
                onChange={(e) => updatePrompt(prompt.id, e.target.value)}
                rows={12}
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-900 rounded-2xl p-6 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-300 shadow-inner"
              />
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  Liquid Variables:{' '}
                </span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold">
                  {'{{profile}}, {{history}}, {{input}}'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 dark:bg-indigo-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-md text-center md:text-left">
          <h4 className="text-xl font-bold mb-2">Cognitive Optimization</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            By adjusting these templates, you can change Aura's tone, focus, and extraction logic.
            Use liquid tags to maintain data flow.
          </p>
        </div>
        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
          <Terminal size={32} className="text-indigo-300" />
        </div>
      </div>
    </div>
  );
};
