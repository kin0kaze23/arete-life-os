import React from 'react';
import {
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  ShieldAlert,
  Monitor,
  Database,
  AlertCircle,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { VaultSection, VaultInput, VaultSelect, VaultSlider } from '@/shared';
import { AuditLogEntry, BackupMeta, RuleOfLife, generateRecoveryCode } from '@/data';

type BackupItem = {
  key: string;
  uploadedAt: string;
  size: number;
  isLatest?: boolean;
};

interface SettingsViewProps {
  isDarkMode: boolean;
  ruleOfLife: RuleOfLife;
  setRuleOfLife: (rule: RuleOfLife) => void;
  toggleDarkMode: () => void;
  exportData: () => void;
  importData: (file: File) => void;
  clearAllData: () => void;
  storageUsage?: number;
  auditLogs: AuditLogEntry[];
  exportAuditLogs: () => void;
  clearAuditLogs: () => void;
  copyCspReportSummary: () => Promise<string>;
  backupIdentity: string | null;
  backupMeta: BackupMeta | null;
  enableBackups: (passphrase: string, recoveryCode: string) => Promise<string>;
  createRemoteBackup: () => Promise<void>;
  listRemoteBackups: (identityOverride?: string) => Promise<BackupItem[]>;
  listRemoteBackupsForRecovery: (
    passphrase: string,
    recoveryCode: string
  ) => Promise<{ identity: string; items: BackupItem[] }>;
  restoreBackupWithRecovery: (params: {
    passphrase: string;
    recoveryCode: string;
    key: string;
  }) => Promise<void>;
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
  auditLogs,
  exportAuditLogs,
  clearAuditLogs,
  copyCspReportSummary,
  backupIdentity,
  backupMeta,
  enableBackups,
  createRemoteBackup,
  listRemoteBackups,
  listRemoteBackupsForRecovery,
  restoreBackupWithRecovery,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [generatedRecoveryCode, setGeneratedRecoveryCode] = React.useState('');
  const [confirmRecoverySaved, setConfirmRecoverySaved] = React.useState(false);
  const [backupPassphrase, setBackupPassphrase] = React.useState('');
  const [backupError, setBackupError] = React.useState<string | null>(null);
  const [backupStatus, setBackupStatus] = React.useState<string | null>(null);
  const [backupItems, setBackupItems] = React.useState<BackupItem[]>([]);
  const [restorePassphrase, setRestorePassphrase] = React.useState('');
  const [restoreRecoveryCode, setRestoreRecoveryCode] = React.useState('');
  const [isBackupBusy, setIsBackupBusy] = React.useState(false);

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

  const handleGenerateRecoveryCode = () => {
    const code = generateRecoveryCode();
    setGeneratedRecoveryCode(code);
    setConfirmRecoverySaved(false);
    setBackupStatus('Recovery code generated. Store it safely.');
  };

  const handleEnableBackups = async () => {
    setBackupError(null);
    setBackupStatus(null);
    setIsBackupBusy(true);
    try {
      const identity = await enableBackups(backupPassphrase, generatedRecoveryCode);
      setBackupStatus(`Backups enabled for identity ${identity.slice(0, 8)}…`);
    } catch (err: any) {
      setBackupError(err?.message || 'Unable to enable backups.');
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackupError(null);
    setBackupStatus(null);
    setIsBackupBusy(true);
    try {
      await createRemoteBackup();
      setBackupStatus('Encrypted backup uploaded.');
      const items = await listRemoteBackups();
      setBackupItems(items);
    } catch (err: any) {
      setBackupError(err?.message || 'Backup failed.');
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleRefreshBackups = async () => {
    setBackupError(null);
    setBackupStatus(null);
    setIsBackupBusy(true);
    try {
      const items = await listRemoteBackups();
      setBackupItems(items);
      setBackupStatus(`Found ${items.length} backups.`);
    } catch (err: any) {
      setBackupError(err?.message || 'Unable to list backups.');
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleFindBackupsForRecovery = async () => {
    setBackupError(null);
    setBackupStatus(null);
    setIsBackupBusy(true);
    try {
      const result = await listRemoteBackupsForRecovery(restorePassphrase, restoreRecoveryCode);
      setBackupItems(result.items);
      setBackupStatus(`Found ${result.items.length} backups for recovery.`);
    } catch (err: any) {
      setBackupError(err?.message || 'Unable to locate backups.');
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleRestoreBackup = async (key: string) => {
    setBackupError(null);
    setBackupStatus(null);
    setIsBackupBusy(true);
    try {
      await restoreBackupWithRecovery({
        passphrase: restorePassphrase,
        recoveryCode: restoreRecoveryCode,
        key,
      });
      setBackupStatus('Backup restored. Unlock to continue.');
    } catch (err: any) {
      setBackupError(err?.message || 'Restore failed.');
    } finally {
      setIsBackupBusy(false);
    }
  };

  // Usage in MB (approx)
  const usageMB = (storageUsage / (1024 * 1024)).toFixed(2);
  const usagePercent = Math.min(100, (storageUsage / (5 * 1024 * 1024)) * 100);
  const recentLogs = auditLogs.slice(0, 50);

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

        <VaultSection
          icon={<HardDrive size={24} />}
          title="Encrypted Backups"
          color="text-indigo-400"
        >
          <div className="col-span-full space-y-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border dark:border-slate-800 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Status
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {backupIdentity ? 'Enabled' : 'Disabled'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Last backup:{' '}
                {backupMeta?.lastBackupAt
                  ? new Date(backupMeta.lastBackupAt).toLocaleString()
                  : 'Never'}
              </div>
              {backupIdentity && (
                <div className="text-[10px] text-slate-500 font-mono">
                  Identity: {backupIdentity.slice(0, 8)}…
                </div>
              )}
            </div>

            {!backupIdentity && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleGenerateRecoveryCode}
                  className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
                >
                  Generate Recovery Code
                </button>
                <VaultInput
                  label="Recovery Code"
                  value={generatedRecoveryCode}
                  onChange={setGeneratedRecoveryCode}
                  placeholder="Generate to reveal"
                />
                <VaultInput
                  label="Vault Passphrase"
                  value={backupPassphrase}
                  onChange={setBackupPassphrase}
                  type="password"
                  placeholder="Required to enable backups"
                />
                <label className="flex items-center gap-3 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                  <input
                    type="checkbox"
                    checked={confirmRecoverySaved}
                    onChange={(e) => setConfirmRecoverySaved(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  I saved this recovery code
                </label>
                <button
                  onClick={handleEnableBackups}
                  disabled={!generatedRecoveryCode || !confirmRecoverySaved || !backupPassphrase}
                  className="md:col-span-2 p-4 rounded-2xl bg-emerald-500/90 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enable Encrypted Backups
                </button>
              </div>
            )}

            {backupIdentity && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleCreateBackup}
                  disabled={isBackupBusy}
                  className="p-4 rounded-2xl bg-emerald-500/90 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  Create Backup
                </button>
                <button
                  onClick={handleRefreshBackups}
                  disabled={isBackupBusy}
                  className="p-4 rounded-2xl bg-slate-900/60 text-slate-200 text-xs font-bold uppercase tracking-widest border border-white/5 disabled:opacity-50"
                >
                  Refresh Backup List
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VaultInput
                label="Restore Passphrase"
                value={restorePassphrase}
                onChange={setRestorePassphrase}
                type="password"
                placeholder="Required to restore"
              />
              <VaultInput
                label="Recovery Code"
                value={restoreRecoveryCode}
                onChange={setRestoreRecoveryCode}
                placeholder="Required to restore"
              />
              <button
                onClick={handleFindBackupsForRecovery}
                disabled={!restorePassphrase || !restoreRecoveryCode || isBackupBusy}
                className="md:col-span-2 p-4 rounded-2xl bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest border border-indigo-500/30 disabled:opacity-50"
              >
                Find Backups for Recovery
              </button>
            </div>

            <div className="space-y-3">
              {backupItems.length === 0 && (
                <div className="text-[11px] text-slate-500">No backups found yet.</div>
              )}
              {backupItems.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-slate-950/40 border border-white/5 rounded-2xl"
                >
                  <div className="space-y-1">
                    <div className="text-xs text-slate-200 font-mono">
                      {new Date(item.uploadedAt).toLocaleString()}
                      {item.isLatest ? ' • latest' : ''}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {(item.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreBackup(item.key)}
                    disabled={!restorePassphrase || !restoreRecoveryCode || isBackupBusy}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>

            {(backupError || backupStatus) && (
              <div
                className={`text-[11px] font-bold uppercase tracking-widest ${
                  backupError ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {backupError || backupStatus}
              </div>
            )}
          </div>
        </VaultSection>

        <VaultSection icon={<ShieldCheck size={24} />} title="Security" color="text-indigo-400">
          <div className="col-span-full space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportAuditLogs}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-200 text-[10px] font-bold uppercase tracking-widest border border-white/5"
              >
                Export Logs
              </button>
              <button
                onClick={clearAuditLogs}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-200 text-[10px] font-bold uppercase tracking-widest border border-white/5"
              >
                Clear Logs
              </button>
              <button
                onClick={() => void copyCspReportSummary()}
                className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30"
              >
                Copy CSP Summary
              </button>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3 max-h-64 overflow-y-auto">
              {recentLogs.length === 0 && (
                <div className="text-[11px] text-slate-500">No audit activity yet.</div>
              )}
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <span className="font-bold uppercase tracking-widest text-slate-400">
                      {log.actionType}
                    </span>
                    <div className="text-slate-200">{log.summary}</div>
                    {log.details && <div className="text-slate-500">{log.details}</div>}
                  </div>
                </div>
              ))}
            </div>
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
