import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useAura, useLifeContext } from '@/core';
import { Sidebar, Header } from '@/layout';
import { LogBar, CommandPalette } from '@/command';
import { askAura } from '@/ai';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { AuthScreen } from '@/app/AuthScreen';
import { isSupabaseConfigured, supabase } from '@/data';
import { X, CheckCircle2, User, Database, Settings } from 'lucide-react';
import { useOnlineStatus, NetworkBanner, Toast } from '@/shared';

const loadVault = () => import('@/vault');
const loadDashboard = () => import('@/dashboard');
const loadStream = () => import('@/stream');
const loadChat = () => import('@/chat');
const loadSettings = () => import('@/settings');
const loadOnboarding = () => import('@/onboarding');

const VaultLockView = React.lazy(() => loadVault().then((m) => ({ default: m.VaultLockView })));
const LifeVaultView = React.lazy(() => loadVault().then((m) => ({ default: m.LifeVaultView })));
const DashboardView = React.lazy(() => loadDashboard().then((m) => ({ default: m.DashboardView })));
const LifeStreamView = React.lazy(() => loadStream().then((m) => ({ default: m.LifeStreamView })));
const ChatView = React.lazy(() => loadChat().then((m) => ({ default: m.ChatView })));
const SettingsView = React.lazy(() => loadSettings().then((m) => ({ default: m.SettingsView })));
const OnboardingView = React.lazy(() =>
  loadOnboarding().then((m) => ({ default: m.OnboardingView }))
);

const LoadingFallback = <div className="p-6 text-slate-400">Loading...</div>;

const App: React.FC = () => {
  const aura = useAura();
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [isAuthenticated, setIsAuthenticated] = useState(!isSupabaseConfigured);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      setIsAuthenticated(true);
      return;
    }

    let mounted = true;

    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setAuthError(error.message);
      }
      setIsAuthenticated(Boolean(data.session));
      setAuthReady(true);
    };

    void initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSendMagicLink = async (email: string) => {
    if (!supabase) return;
    setAuthError(null);
    setIsSendingMagicLink(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err?.message || 'Unable to send magic link.');
    } finally {
      setIsSendingMagicLink(false);
    }
  };
  const lifeContext = useLifeContext({
    isOnboarded: aura.isOnboarded,
    profile: aura.profile,
    memoryItems: aura.memoryItems,
    goals: aura.goals,
    timelineEvents: aura.timelineEvents,
    dailyPlan: aura.dailyPlan,
    prompts: aura.prompts,
    lifeContextSnapshots: aura.lifeContextSnapshots,
    latestDimensionSnapshots: aura.latestDimensionSnapshots,
    lastSessionScores: aura.lastSessionScores,
    dashboardPreferences: aura.dashboardPreferences,
    setLifeContextSnapshots: aura.setLifeContextSnapshots,
    setLatestDimensionSnapshots: aura.setLatestDimensionSnapshots,
    setLastSessionScores: aura.setLastSessionScores,
    setDashboardPreferences: aura.setDashboardPreferences,
    setLifeContextSignalHandler: aura.setLifeContextSignalHandler,
  });
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'stream' | 'chat' | 'vault' | 'settings'
  >('dashboard');
  // const [vaultSubTab, setVaultSubTab] = useState<'identity' | 'knowledge'>('identity'); // Deprecated
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    {
      role: 'user' | 'aura';
      text: string;
      timestamp: number;
      sources?: { title: string; uri: string }[];
    }[]
  >([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userInput, setUserInput] = useState('');

  const [toast, setToast] = useState<{
    message: string;
    type?: 'success' | 'info' | 'error';
    onAction?: () => void;
    actionLabel?: string;
  } | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    if (import.meta.env.VITE_E2E === '1' && aura.isUnlocked && aura.isOnboarded) {
      aura.refreshAura();
    }
  }, [aura.isUnlocked, aura.isOnboarded]);

  if (!authReady) {
    return <div className="min-h-screen bg-[#05070d] text-slate-300 p-8">Loading...</div>;
  }

  if (isSupabaseConfigured && !isAuthenticated) {
    return (
      <AuthScreen
        onSendMagicLink={handleSendMagicLink}
        authError={authError}
        isSending={isSendingMagicLink}
      />
    );
  }

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'error' = 'info',
    onAction?: () => void,
    actionLabel?: string
  ) => {
    setToast({ message, type, onAction, actionLabel });
    setTimeout(() => setToast(null), 5000);
  };

  if (!aura.isUnlocked) {
    return (
      <Suspense fallback={LoadingFallback}>
        <VaultLockView
          hasVault={aura.hasVault}
          hasLegacyData={aura.hasLegacyData}
          lockError={aura.lockError}
          onUnlock={aura.unlock}
          onSetup={aura.setupVault}
        />
      </Suspense>
    );
  }

  const handleLog = async (e: React.FormEvent, files?: File[]) => {
    if (e?.preventDefault) e.preventDefault();
    if (!isOnline) {
      showToast('Kernel link offline. Cannot sync signals.', 'error');
      return;
    }
    setLogError(null);
    const inputToProcess = userInput.trim();
    if (!inputToProcess && (!files || files.length === 0)) return;
    const normalizedInput = inputToProcess.toLowerCase();

    if (normalizedInput === '/sync') {
      await aura.refreshAura({ force: true });
      setUserInput('');
      showToast('Dashboard refreshed.', 'success');
      return;
    }
    if (normalizedInput.startsWith('/ask')) {
      const query = inputToProcess.replace(/^\/ask\s*/i, '').trim();
      if (query.length > 0) {
        await handleSendMessage(query);
      } else {
        setActiveTab('chat');
        showToast('Ask command ready in assistant.', 'info');
      }
      setUserInput('');
      return;
    }

    if (activeTab === 'chat' && inputToProcess) {
      handleSendMessage(inputToProcess);
      setUserInput('');
      return;
    }
    try {
      await aura.logMemory(inputToProcess, files, false);
      setUserInput('');
      showToast('Saved', 'success');
    } catch (err: any) {
      const message = err?.message || 'Internalization error';
      setLogError(message);
      showToast(message, 'error');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setActiveTab('chat');
    setChatHistory((prev) => [...prev, { role: 'user', text, timestamp: Date.now() }]);
    try {
      const response = await askAura(
        text,
        aura.memoryItems,
        aura.profile,
        aura.prompts.find((p) => p.id === 'oracle')!
      );
      setChatHistory((prev) => [
        ...prev,
        { role: 'aura', text: response.text, timestamp: Date.now(), sources: response.sources },
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'aura', text: 'Oracle node connection unstable.', timestamp: Date.now() },
      ]);
    }
  };

  if (!aura.isOnboarded) {
    return (
      <Suspense fallback={LoadingFallback}>
        <OnboardingView
          profile={aura.profile}
          setProfile={aura.setProfile}
          ruleOfLife={aura.ruleOfLife}
          setRuleOfLife={aura.setRuleOfLife}
          onComplete={aura.completeOnboarding}
          logMemory={async (input) => aura.logMemory(input)}
          runDeepInitialization={aura.runDeepInitialization}
        />
      </Suspense>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden font-inter ${isDarkMode ? 'bg-[#02040a] text-slate-100' : 'bg-slate-100 text-slate-900'}`}
    >
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        familySpace={aura.familySpace}
        activeUserId={aura.activeUserId}
        onSwitchUser={(id) => aura.setActiveUserId(id)}
        onAddMember={(name) => aura.addFamilyMember(name)}
        onCapture={() => setIsCommandPaletteOpen(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {!isOnline && <NetworkBanner />}
        <Header
          activeTab={activeTab}
          profile={aura.profile}
          isGeneratingTasks={aura.isGeneratingTasks}
          refreshTasks={aura.refreshAura}
          onOpenProfile={() => {
            setActiveTab('vault');
          }}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <Toast
          message={toast?.message || ''}
          type={toast?.type as 'success' | 'info' | 'error'}
          isVisible={!!toast}
          onClose={() => setToast(null)}
          onAction={toast?.onAction}
          actionLabel={toast?.actionLabel}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          <ErrorBoundary>
            <Suspense fallback={LoadingFallback}>
              <div
                key={`${activeTab}-${aura.activeUserId}`}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full"
              >
                {activeTab === 'dashboard' && (
                  <DashboardView
                    {...(aura as any)}
                    toggleTask={(id) => {
                      aura.toggleTask(id);
                      const task = aura.dailyPlan.find((t) => t.id === id);
                      if (task && !task.completed) {
                        showToast('Task completed', 'success', aura.undoTaskAction, 'Undo');
                      }
                    }}
                    deleteTask={(id) => {
                      aura.deleteTask(id);
                      showToast('Task removed', 'info', aura.undoTaskAction, 'Undo');
                    }}
                    memory={aura.memoryItems}
                    refreshAll={aura.refreshAura}
                    onNavigate={setActiveTab as any}
                    logMemory={handleLog}
                    onToast={showToast}
                    alwaysDoChips={aura.alwaysDo}
                    alwaysWatchChips={aura.alwaysWatch}
                    updateTimelineEvent={aura.updateTimelineEvent}
                    deleteTimelineEvent={aura.deleteTimelineEvent}
                    lifeContext={lifeContext}
                    inboxEntries={aura.inboxEntries}
                    inboxReviewConfidence={aura.inboxReviewConfidence}
                    onMergeInbox={aura.mergeInboxEntries}
                    onRefreshInbox={aura.refreshInbox}
                  />
                )}
                {activeTab === 'vault' && (
                  <LifeVaultView
                    profile={aura.profile}
                    ruleOfLife={aura.ruleOfLife}
                    claims={aura.claims}
                    memoryItems={aura.memoryItems}
                    sources={aura.sources}
                    updateProfile={(s, f, v) =>
                      aura.setProfile((prev) => ({
                        ...prev,
                        [s]: { ...(prev as any)[s], [f]: v },
                      }))
                    }
                    updateRuleOfLife={aura.setRuleOfLife}
                    onApprove={aura.approveClaims}
                    onReject={aura.rejectClaims}
                    onResolve={aura.resolveConflict}
                    onDeleteClaim={aura.deleteClaim}
                    onDeleteMemory={aura.deleteMemoryItem}
                    onUpdate={aura.updateClaim}
                    onSync={aura.refreshAura}
                    onToast={showToast}
                    onAdd={async (input) => {
                      await aura.logMemory(input);
                      aura.refreshAura({ force: true });
                    }}
                  />
                )}
                {activeTab === 'stream' && (
                  <LifeStreamView
                    memory={aura.memoryItems}
                    timelineEvents={aura.timelineEvents}
                    profile={aura.profile}
                    addTimelineEvent={aura.addTimelineEvent}
                    updateTimelineEvent={aura.updateTimelineEvent}
                    deleteTimelineEvent={aura.deleteTimelineEvent}
                    activatePrepPlan={aura.activatePrepPlan}
                    onDeleteFacts={() => {}}
                  />
                )}
                {activeTab === 'chat' && (
                  <ChatView
                    chatHistory={chatHistory}
                    isProcessing={aura.isProcessing}
                    scrollRef={scrollRef}
                    onSendMessage={handleSendMessage}
                  />
                )}
                {activeTab === 'settings' && (
                  <SettingsView
                    isDarkMode={isDarkMode}
                    ruleOfLife={aura.ruleOfLife}
                    setRuleOfLife={aura.setRuleOfLife}
                    toggleDarkMode={() => setIsDarkMode((prev) => !prev)}
                    exportData={aura.exportData}
                    importData={aura.importData}
                    clearAllData={aura.clearAllData}
                    storageUsage={aura.storageUsage}
                    cloudMigration={aura.cloudMigration}
                    onMigrateToCloud={aura.migrateToCloud}
                    telegram={aura.telegram}
                    onGenerateTelegramLinkCode={aura.generateTelegramLinkCode}
                    onUnlinkTelegram={aura.unlinkTelegram}
                    inboxAutoMerge={aura.inboxAutoMerge}
                    onToggleInboxAutoMerge={aura.setInboxAutoMerge}
                    inboxReviewConfidence={aura.inboxReviewConfidence}
                    onChangeInboxReviewConfidence={aura.setInboxReviewConfidence}
                    auditLogs={aura.auditLogs}
                    exportAuditLogs={aura.exportAuditLogs}
                    clearAuditLogs={aura.clearAuditLogs}
                    copyCspReportSummary={aura.copyCspReportSummary}
                    backupIdentity={aura.backupIdentity}
                    backupMeta={aura.backupMeta}
                    enableBackups={aura.enableBackups}
                    createRemoteBackup={aura.createRemoteBackup}
                    listRemoteBackups={aura.listRemoteBackups}
                    listRemoteBackupsForRecovery={aura.listRemoteBackupsForRecovery}
                    restoreBackupWithRecovery={aura.restoreBackupWithRecovery}
                  />
                )}
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={setActiveTab}
          onSync={() => aura.refreshAura({ force: true })}
          onExport={aura.exportData}
          onReset={aura.clearAllData}
        />
        <LogBar
          userInput={userInput}
          setUserInput={setUserInput}
          isProcessing={aura.isProcessing}
          logError={logError}
          onLog={handleLog}
          onExport={aura.exportData}
          onReset={aura.clearAllData}
          memory={aura.memoryItems}
        />
      </main>
    </div>
  );
};

export default App;
