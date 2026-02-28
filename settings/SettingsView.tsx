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
  Cloud,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  RefreshCw,
  Server,
} from 'lucide-react';
import { RuleOfLife, isSupabaseConfigured } from '@/data';
import { VaultInput, VaultSelect, VaultSlider } from '@/shared';

interface SettingsViewProps {
  isDarkMode: boolean;
  ruleOfLife: RuleOfLife;
  setRuleOfLife: (rule: RuleOfLife) => void;
  toggleDarkMode: () => void;
  exportData: () => void;
  importData: (file: File) => void;
  clearAllData: () => void;
  storageUsage?: number;
  cloudMigration?: {
    status: 'idle' | 'running' | 'done' | 'error';
    message?: string;
    migrated?: number;
  };
  isCloudSyncAvailable?: boolean;
  isCloudConnected?: boolean;
  onMigrateToCloud?: () => Promise<void> | void;
  telegram?: {
    linked: boolean;
    username?: string;
    firstName?: string;
    linkedAt?: string;
    linkCode?: string | null;
    linkCodeExpiresAt?: number | null;
  };
  onGenerateTelegramLinkCode?: () => Promise<void> | void;
  onUnlinkTelegram?: () => Promise<void> | void;
  inboxAutoMerge?: boolean;
  onToggleInboxAutoMerge?: (value: boolean) => void;
  inboxReviewConfidence?: number;
  onChangeInboxReviewConfidence?: (value: number) => void;
  auditLogs?: unknown[];
  exportAuditLogs?: () => void;
  clearAuditLogs?: () => void;
  copyCspReportSummary?: () => void;
  backupIdentity?: unknown;
  backupMeta?: unknown;
  enableBackups?: (...args: any[]) => Promise<any> | any;
  createRemoteBackup?: (...args: any[]) => Promise<any> | any;
  listRemoteBackups?: (...args: any[]) => Promise<any> | any;
  listRemoteBackupsForRecovery?: (...args: any[]) => Promise<any> | any;
  restoreBackupWithRecovery?: (...args: any[]) => Promise<any> | any;
}

type HealthPayload = {
  ok: boolean;
  timestamp?: string;
  services?: {
    ai?: {
      configured?: boolean;
      defaultProvider?: string;
      hasOpenAIKey?: boolean;
      hasGeminiKey?: boolean;
      hasXAIKey?: boolean;
    };
    telegram?: {
      configured?: boolean;
      hasBotToken?: boolean;
      hasWebhookSecret?: boolean;
    };
    storage?: {
      hasBlobToken?: boolean;
    };
    runtime?: {
      node?: string;
      vercelEnv?: string;
      region?: string;
    };
  };
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  ruleOfLife,
  setRuleOfLife,
  toggleDarkMode,
  exportData,
  importData,
  clearAllData,
  storageUsage = 0,
  cloudMigration,
  isCloudSyncAvailable,
  isCloudConnected,
  onMigrateToCloud,
  telegram,
  onGenerateTelegramLinkCode,
  onUnlinkTelegram,
  inboxAutoMerge = false,
  onToggleInboxAutoMerge,
  inboxReviewConfidence = 0.65,
  onChangeInboxReviewConfidence,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isGeneratingLink, setIsGeneratingLink] = React.useState(false);
  const [isUnlinking, setIsUnlinking] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [statusType, setStatusType] = React.useState<'success' | 'error' | 'info'>('info');
  const [health, setHealth] = React.useState<HealthPayload | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = React.useState(false);
  const [healthError, setHealthError] = React.useState<string | null>(null);
  const statusTimeoutRef = React.useRef<number | null>(null);

  const supabaseReady =
    typeof isCloudSyncAvailable === 'boolean' ? isCloudSyncAvailable : isSupabaseConfigured;
  const cloudConnected = Boolean(isCloudConnected);
  const telegramActionsReady = supabaseReady && cloudConnected && !!onGenerateTelegramLinkCode;
  const cloudActionsReady = supabaseReady && cloudConnected && !!onMigrateToCloud;

  const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
    if (statusTimeoutRef.current) window.clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = window.setTimeout(() => setStatusMessage(null), 3500);
  };

  const loadHealth = async () => {
    setIsLoadingHealth(true);
    setHealthError(null);
    try {
      const response = await fetch('/api/health');
      const payload = (await response.json()) as HealthPayload;
      if (!response.ok) throw new Error('Health endpoint unavailable.');
      setHealth(payload);
    } catch (error: any) {
      setHealth(null);
      setHealthError(error?.message || 'Unable to load system health.');
    } finally {
      setIsLoadingHealth(false);
    }
  };

  React.useEffect(() => {
    void loadHealth();
    return () => {
      if (statusTimeoutRef.current) window.clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const updateRule = (section: keyof RuleOfLife, field: string, value: any) => {
    setRuleOfLife({
      ...ruleOfLife,
      [section]: { ...(ruleOfLife[section] as any), [field]: value },
    });
  };

  const handleExport = async () => {
    try {
      await Promise.resolve(exportData());
      showStatus('Backup exported.', 'success');
    } catch (error: any) {
      showStatus(error?.message || 'Backup export failed.', 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      await Promise.resolve(importData(e.target.files[0]));
      showStatus('Backup imported.', 'success');
    } catch (error: any) {
      showStatus(error?.message || 'Backup import failed.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleGenerateLinkCode = async () => {
    if (!onGenerateTelegramLinkCode) return;
    setIsGeneratingLink(true);
    try {
      await onGenerateTelegramLinkCode();
      showStatus('Telegram link code generated.', 'success');
    } catch (error: any) {
      showStatus(error?.message || 'Failed to generate link code.', 'error');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleUnlink = async () => {
    if (!onUnlinkTelegram) return;
    setIsUnlinking(true);
    try {
      await onUnlinkTelegram();
      showStatus('Telegram unlinked.', 'success');
    } catch (error: any) {
      showStatus(error?.message || 'Failed to unlink Telegram.', 'error');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleMigrate = async () => {
    if (!onMigrateToCloud) return;
    try {
      await onMigrateToCloud();
      showStatus('Cloud migration completed.', 'success');
    } catch (error: any) {
      showStatus(error?.message || 'Cloud migration failed.', 'error');
    }
  };

  const handleClearAllData = () => {
    const confirmed = confirm('Delete all local data permanently? This cannot be undone.');
    if (!confirmed) return;
    clearAllData();
    showStatus('All local data cleared.', 'success');
  };

  const usageMB = (storageUsage / (1024 * 1024)).toFixed(2);
  const usagePercent = Math.min(100, (storageUsage / (5 * 1024 * 1024)) * 100);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-32 pt-6">
      <section className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,34,50,0.92),rgba(16,22,32,0.88))] p-6">
        <h3 className="text-3xl font-semibold tracking-tight text-slate-100">Workspace Controls</h3>
        <p className="mt-2 text-sm text-slate-400">Health, sync, backups, and Telegram.</p>

        {statusMessage && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
              statusType === 'success'
                ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-100'
                : statusType === 'error'
                  ? 'border-rose-300/30 bg-rose-500/12 text-rose-100'
                  : 'border-blue-300/30 bg-blue-500/12 text-blue-100'
            }`}
          >
            {statusType === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{statusMessage}</span>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-cyan-300" />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">System Health</p>
          </div>
          <button
            type="button"
            onClick={() => void loadHealth()}
            disabled={isLoadingHealth}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-slate-200 disabled:opacity-50"
          >
            <RefreshCw size={11} className={isLoadingHealth ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {healthError ? (
          <p className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {healthError}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <HealthChip
              label="AI"
              value={health?.services?.ai?.configured ? 'Ready' : 'Missing keys'}
              tone={health?.services?.ai?.configured ? 'good' : 'warn'}
              detail={
                health?.services?.ai?.defaultProvider
                  ? `Provider: ${health.services.ai.defaultProvider}`
                  : 'No provider detected'
              }
            />
            <HealthChip
              label="Telegram"
              value={health?.services?.telegram?.configured ? 'Ready' : 'Not configured'}
              tone={health?.services?.telegram?.configured ? 'good' : 'warn'}
              detail={
                health?.services?.telegram?.configured
                  ? 'Bot token + webhook secret present'
                  : 'Bot token or webhook secret missing'
              }
            />
            <HealthChip
              label="Cloud Sync"
              value={supabaseReady ? (cloudConnected ? 'Connected' : 'Sign in required') : 'Disabled'}
              tone={supabaseReady && cloudConnected ? 'good' : 'warn'}
              detail={
                supabaseReady
                  ? cloudConnected
                    ? 'Supabase session active'
                    : 'Supabase configured but no active session'
                  : 'Supabase env vars missing'
              }
            />
            <HealthChip
              label="Blob Storage"
              value={health?.services?.storage?.hasBlobToken ? 'Ready' : 'Unavailable'}
              tone={health?.services?.storage?.hasBlobToken ? 'good' : 'warn'}
              detail={
                health?.services?.runtime?.vercelEnv
                  ? `${health.services.runtime.vercelEnv} ${health.services.runtime.region || ''}`.trim()
                  : 'Runtime metadata unavailable'
              }
            />
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Monitor size={16} className="text-blue-200" />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Appearance</p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/[0.06] p-2 text-slate-200">
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Theme</p>
                <p className="text-xs text-slate-400">Switch between dark and light mode.</p>
              </div>
            </div>
            <button
              aria-label="Toggle Theme"
              onClick={toggleDarkMode}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-indigo-600' : 'bg-slate-500'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
          <div className="mb-3 flex items-center gap-2">
            <HardDrive size={16} className="text-blue-200" />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Local Storage</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">Encrypted vault usage</p>
              <p className="text-sm font-semibold text-slate-100">{usageMB} MB</p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full ${usagePercent > 80 ? 'bg-rose-400' : 'bg-indigo-400'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Approximate browser quota target: 5 MB.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-2">
          <SparklesIcon />
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Daily Rules</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
            placeholder="Weekly rest day"
          />
          <VaultSlider
            label="Daily Task Cap"
            value={ruleOfLife.taskPreferences.dailyCap}
            min={1}
            max={10}
            onChange={(v) => updateRule('taskPreferences', 'dailyCap', parseInt(v, 10))}
          />
          <VaultSelect
            label="Energy Profile"
            value={ruleOfLife.taskPreferences.energyOffset}
            options={['Morning Heavy', 'Afternoon Heavy', 'Balanced', 'Evening Heavy']}
            onChange={(v) => updateRule('taskPreferences', 'energyOffset', v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Database size={16} className="text-emerald-300" />
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Backups</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            aria-label="Export JSON Backup"
            onClick={() => void handleExport()}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-emerald-300/35"
          >
            <Download size={16} className="text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-slate-100">Export Backup</p>
              <p className="text-xs text-slate-400">Download local encrypted snapshot.</p>
            </div>
          </button>

          <button
            aria-label="Import JSON Backup"
            onClick={handleImportClick}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-emerald-300/35"
          >
            <Upload size={16} className="text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-slate-100">Import Backup</p>
              <p className="text-xs text-slate-400">Restore from a previous JSON export.</p>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={(event) => void handleFileChange(event)}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle size={16} className="text-sky-300" />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Telegram</p>
          </div>
          {!supabaseReady ? (
            <p className="mb-3 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Cloud sync is not configured. Telegram linking is unavailable until Supabase env vars are set.
            </p>
          ) : !cloudConnected ? (
            <p className="mb-3 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Sign in and complete cloud migration to enable Telegram linking.
            </p>
          ) : null}
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-slate-100">
              Status:{' '}
              <span className={telegram?.linked ? 'text-emerald-300' : 'text-slate-400'}>
                {telegram?.linked ? 'Connected' : 'Not linked'}
              </span>
            </p>
            {telegram?.linked ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-300">
                  @{telegram.username || 'unknown'} {telegram.firstName ? `(${telegram.firstName})` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => void handleUnlink()}
                  disabled={isUnlinking || !onUnlinkTelegram || !cloudConnected}
                  className="rounded-lg border border-rose-300/35 px-3 py-2 text-xs font-semibold text-rose-200 disabled:opacity-50"
                >
                  {isUnlinking ? 'Unlinking...' : 'Unlink Telegram'}
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleGenerateLinkCode()}
                  disabled={isGeneratingLink || !telegramActionsReady}
                  className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                >
                  {isGeneratingLink ? 'Generating...' : 'Generate Link Code'}
                </button>
                {telegram?.linkCode && (
                  <div className="rounded-lg border border-sky-300/35 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                    Send in Telegram: <code className="font-semibold">/link {telegram.linkCode}</code>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Inbox Auto-Merge</p>
                <p className="text-xs text-slate-400">Auto-merge high-confidence entries only.</p>
              </div>
              <button
                aria-label="Toggle Inbox Auto Merge"
                disabled={!cloudConnected}
                onClick={() => onToggleInboxAutoMerge?.(!inboxAutoMerge)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  inboxAutoMerge ? 'bg-emerald-500' : 'bg-slate-700'
                } disabled:opacity-45`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    inboxAutoMerge ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span>Review threshold</span>
                <span>{Math.round(inboxReviewConfidence * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={0.95}
                step={0.05}
                value={inboxReviewConfidence}
                disabled={!cloudConnected}
                onChange={(e) => onChangeInboxReviewConfidence?.(Number(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-400 disabled:opacity-45"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Cloud size={16} className="text-cyan-300" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Cloud Sync</p>
          </div>
          {!supabaseReady ? (
            <p className="mb-3 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Supabase is not configured in this deployment. Cloud migration is disabled.
            </p>
          ) : !cloudConnected ? (
            <p className="mb-3 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Sign in to Supabase to enable cloud migration and cross-device sync.
            </p>
          ) : null}
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-slate-100">Migrate local vault to cloud</p>
            <p className="mt-1 text-xs text-slate-400">Encrypt existing entries and sync them across devices.</p>
            {cloudMigration?.message && <p className="mt-2 text-xs text-cyan-200">{cloudMigration.message}</p>}
            <button
              type="button"
              onClick={() => void handleMigrate()}
              disabled={!cloudActionsReady || cloudMigration?.status === 'running'}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
            >
              <RefreshCw size={12} className={cloudMigration?.status === 'running' ? 'animate-spin' : ''} />
              {cloudMigration?.status === 'running' ? 'Migrating...' : 'Run Migration'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-300/20 bg-rose-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 text-rose-300" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-rose-100">Danger Zone</p>
            <p className="mt-1 text-xs text-rose-200/80">Delete all local data, including memory, tasks, and profile state.</p>
            <button
              onClick={handleClearAllData}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/25"
            >
              <Trash2 size={13} /> Clear Local Data
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const SparklesIcon: React.FC = () => (
  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200">
    <span className="text-[10px]">*</span>
  </div>
);

const HealthChip: React.FC<{
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warn';
}> = ({ label, value, detail, tone }) => (
  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className={`mt-1 text-sm font-semibold ${tone === 'good' ? 'text-emerald-200' : 'text-amber-100'}`}>
      {value}
    </p>
    <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
  </div>
);
