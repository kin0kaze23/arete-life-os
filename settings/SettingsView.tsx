import React from 'react';
import {
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  Info,
  ShieldAlert,
  Monitor,
  Database,
  AlertCircle,
  ShieldCheck,
  Zap,
  HardDrive,
} from 'lucide-react';
import { VaultSection, VaultInput, VaultSelect, VaultSlider } from '@/shared';
import { ProactiveInsight, RuleOfLife } from '@/data';

interface SettingsViewProps {
  isDarkMode: boolean;
  ruleOfLife: RuleOfLife;
  setRuleOfLife: (rule: RuleOfLife) => void;
  toggleDarkMode: () => void;
  exportData: () => void;
  importData: (file: File) => void;
  clearAllData: () => void;
  storageUsage?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  ruleOfLife,
  setRuleOfLife,
  toggleDarkMode,
  exportData,
  importData,
  clearAllData,
  storageUsage = 0,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      importData(e.target.files[0]);
    }
  };

  const updateRule = (section: keyof RuleOfLife, field: string, value: any) => {
    setRuleOfLife({
      ...ruleOfLife,
      [section]: { ...(ruleOfLife[section] as any), [field]: value },
    });
  };

  // Usage in MB (approx)
  const usageMB = (storageUsage / (1024 * 1024)).toFixed(2);
  const usagePercent = Math.min(100, (storageUsage / (5 * 1024 * 1024)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 pt-6 px-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
            System Configuration
          </span>
        </div>
        <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          Settings
        </h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Manage your AURA OS environment, operational guardrails, and data portability.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Storage Monitoring */}
        <div className="glass-panel rounded-[2rem] p-8 border border-white/5 bg-white/[0.01] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-900 text-indigo-400">
                <HardDrive size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest">
                  Local Core Storage
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                  Encrypted Browser Persistence
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-white font-mono">{usageMB} MB</span>
              <span className="text-[10px] text-slate-500 font-bold block">OF 5.00 MB QUOTA</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${usagePercent > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        <VaultSection
          icon={<ShieldCheck size={24} />}
          title="Operational Rules"
          color="text-indigo-400"
        >
          <div className="col-span-full space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VaultInput
                label="Sleep Window"
                value={ruleOfLife.nonNegotiables.sleepWindow}
                onChange={(v) => updateRule('nonNegotiables', 'sleepWindow', v)}
                placeholder="e.g. 11pm - 7am"
              />
              <VaultInput
                label="Sabbath Protocol"
                value={ruleOfLife.nonNegotiables.sabbath}
                onChange={(v) => updateRule('nonNegotiables', 'sabbath', v)}
                placeholder="Weekly day of rest..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VaultSlider
                label="Daily Task Cap"
                value={ruleOfLife.taskPreferences.dailyCap}
                min={1}
                max={10}
                onChange={(v) => updateRule('taskPreferences', 'dailyCap', parseInt(v))}
              />
              <VaultSelect
                label="Energy Flow Peak"
                value={ruleOfLife.taskPreferences.energyOffset}
                options={['Morning Heavy', 'Afternoon Heavy', 'Balanced', 'Evening Heavy']}
                onChange={(v) => updateRule('taskPreferences', 'energyOffset', v)}
              />
            </div>
          </div>
        </VaultSection>

        <VaultSection icon={<Monitor size={24} />} title="Appearance" color="text-indigo-400">
          <div className="col-span-full flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-500">
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Visual Theme</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Toggle dark and light modes
                </p>
              </div>
            </div>
            <button
              aria-label="Toggle Theme"
              onClick={toggleDarkMode}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </VaultSection>

        <VaultSection
          icon={<Database size={24} />}
          title="Data Portability"
          color="text-emerald-400"
        >
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              aria-label="Export JSON Backup"
              onClick={exportData}
              className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border dark:border-slate-800 hover:border-emerald-500/30 transition-all group"
            >
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-emerald-500 group-hover:scale-110 transition-transform">
                <Download size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 dark:text-white text-sm">Export Backup</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Save your Life OS to JSON
                </p>
              </div>
            </button>

            <button
              aria-label="Import JSON Backup"
              onClick={handleImportClick}
              className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border dark:border-slate-800 hover:border-emerald-500/30 transition-all group"
            >
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-emerald-500 group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 dark:text-white text-sm">Import Restore</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Load data from a backup
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileChange}
              />
            </button>
          </div>
        </VaultSection>

        <VaultSection icon={<ShieldAlert size={24} />} title="Danger Zone" color="text-rose-400">
          <div className="col-span-full">
            <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-rose-500 tracking-tight uppercase">
                    Factory Reset
                  </h4>
                  <p className="text-xs text-rose-600 dark:text-rose-400/80 font-medium leading-relaxed mt-1">
                    Purging all data will immediately delete all your history, identity nodes, and
                    custom prompts. This action is irreversible.
                  </p>
                </div>
              </div>

              <button
                onClick={clearAllData}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-rose-500/10"
              >
                <Trash2 size={18} /> Purge All Neural Context
              </button>
            </div>
          </div>
        </VaultSection>
      </div>
    </div>
  );
};
