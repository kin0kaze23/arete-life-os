import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useAura } from '@/core';
import { Sidebar, Header } from '@/layout';
import { LogBar, CommandPalette } from '@/command';
import { askAura } from '@/ai';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { X, CheckCircle2, User, Database, Settings } from 'lucide-react';
import { useOnlineStatus, NetworkBanner, Toast, BackgroundAura } from '@/shared';
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';

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
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'stream' | 'chat' | 'vault' | 'settings'
  >('dashboard');
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

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'error' = 'info',
    onAction?: () => void,
    actionLabel?: string
  ) => {
    setToast({ message, type, onAction, actionLabel });
    setTimeout(() => setToast(null), 5000);
  };

  const handleLog = async (e: React.FormEvent, files?: File[]) => {
    if (e?.preventDefault) e.preventDefault();
    if (!isOnline) {
      showToast('Kernel link offline. Cannot sync signals.', 'error');
      return;
    }
    setLogError(null);
    const inputToProcess = userInput.trim();
    if (!inputToProcess && (!files || files.length === 0)) return;
    if (activeTab === 'chat' && inputToProcess) {
      handleSendMessage(inputToProcess);
      setUserInput('');
      return;
    }
    try {
      await aura.logMemory(inputToProcess, files, true);
      setUserInput('');
      showToast('Memory Internalized', 'success');
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

  return (
    <>
      <BackgroundAura />
      <SignedOut>
        <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
          {/* Centered card */}
          <div className="relative z-10 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-700">
            {/* Logo + branding above the card */}
            <div className="text-center mb-8">
              {/* Arete "A" mark */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 mb-5 shadow-xl">
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  className="w-7 h-7"
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
                Welcome back
              </h1>
              <p className="text-white/40 text-sm mt-1.5 font-medium">Your Life Pulse is waiting</p>
              {/* 5 dimension dots */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {[
                  'var(--dim-health)',
                  'var(--dim-finance)',
                  'var(--dim-relationships)',
                  'var(--dim-spiritual)',
                  'var(--dim-personal)',
                ].map((color, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full opacity-60"
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>

            {/* Clerk sign-in widget — fully dark themed */}
            <SignIn
              routing="hash"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl w-full',
                  cardBox: 'w-full shadow-none rounded-2xl',
                  header: 'hidden',
                  socialButtonsBlockButton:
                    'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-white transition-all rounded-xl h-11',
                  socialButtonsBlockButtonText: 'text-white/80 font-medium text-sm',
                  socialButtonsBlockButtonArrow: 'text-white/40',
                  dividerLine: 'bg-white/[0.06]',
                  dividerText: 'text-white/30 text-xs',
                  formFieldLabel:
                    'text-white/50 text-xs font-semibold uppercase tracking-widest mb-1',
                  formFieldInput:
                    'bg-white/[0.04] border border-white/[0.08] hover:border-white/20 focus:border-white/40 focus:bg-white/[0.06] text-white placeholder-white/20 rounded-xl px-4 h-12 text-sm transition-all outline-none',
                  formButtonPrimary:
                    'bg-white text-[#02040a] hover:bg-white/90 font-bold text-sm tracking-wider rounded-xl h-12 transition-all active:scale-[0.98]',
                  footerActionLink:
                    'text-white/60 hover:text-white font-semibold transition-colors',
                  footerActionText: 'text-white/30 text-sm',
                  footer: 'bg-transparent border-t border-white/[0.06] pt-4',
                  footerPages: 'bg-transparent',
                  footerPagesLink: 'text-white/30 hover:text-white/60 text-xs',
                  internal: 'bg-transparent',
                  logoBox: 'hidden',
                  logoImage: 'hidden',
                  identityPreviewEditButton: 'text-white/60 hover:text-white transition-colors',
                  identityPreviewText: 'text-white/80 text-sm',
                  errorText: 'text-rose-400 text-xs',
                  formFieldErrorText: 'text-rose-400 text-xs mt-1',
                  formFieldSuccessText: 'text-emerald-400 text-xs mt-1',
                  formFieldHintText: 'text-white/30 text-xs mt-1',
                  otpCodeFieldInput:
                    'bg-white/[0.04] border border-white/[0.08] text-white rounded-xl text-center font-bold text-lg h-14 w-12',
                  resendCodeLink:
                    'text-white/60 hover:text-white font-medium text-sm transition-colors',
                  alternativeMethodsBlockButton:
                    'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/80 rounded-xl h-11 text-sm transition-all',
                },
                layout: {
                  logoPlacement: 'none',
                  socialButtonsVariant: 'iconButton',
                },
              }}
            />

            {/* Minimal footer */}
            <p className="text-center text-white/20 text-xs mt-6 font-medium">
              Secured by Clerk · End-to-end encrypted
            </p>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {!aura.isUnlocked ? (
          <Suspense fallback={LoadingFallback}>
            <VaultLockView
              hasVault={aura.hasVault}
              hasLegacyData={aura.hasLegacyData}
              lockError={aura.lockError}
              onUnlock={aura.unlock}
              onSetup={aura.setupVault}
            />
          </Suspense>
        ) : !aura.isOnboarded ? (
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
        ) : (
          <div className="flex h-screen bg-[#02040a] text-slate-100 overflow-hidden font-inter dark">
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
                              showToast('Task Optimized', 'success', aura.undoTaskAction, 'Undo');
                            }
                          }}
                          deleteTask={(id) => {
                            aura.deleteTask(id);
                            showToast('Task Purged', 'info', aura.undoTaskAction, 'Undo');
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
                          toggleDarkMode={() => {}}
                          exportData={aura.exportData}
                          importData={aura.importData}
                          clearAllData={aura.clearAllData}
                          storageUsage={aura.storageUsage}
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
        )}
      </SignedIn>
    </>
  );
};

export default App;
