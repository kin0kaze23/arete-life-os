import React, { useState, useRef, useEffect } from 'react';
import { useAura } from '../core/useAura';
import { Sidebar } from '../layout/Sidebar';
import { Header } from '../layout/Header';
import { LogBar } from '../command/LogBar';
import { VaultView } from '../vault/VaultView';
import { ChatView } from '../chat/ChatView';
import { LifeStreamView } from '../stream/LifeStreamView';
import { DashboardView } from '../dashboard/DashboardView';
import { MemoryVaultView } from '../vault/MemoryVaultView';
import { SettingsView } from '../settings/SettingsView';
import { OnboardingView } from '../onboarding/OnboardingView';
import { VerificationSheet } from '../vault/VerificationSheet';
import { CommandPalette } from '../command/CommandPalette';
import { askAura } from '../ai/geminiService';
import { ErrorBoundary } from './ErrorBoundary';
import { VaultLockView } from '../vault/VaultLockView';
import { X, CheckCircle2, User, Database, Settings } from 'lucide-react';
import { CategorizedFact, ProposedUpdate } from '../data/types';
import { useOnlineStatus, NetworkBanner } from '../shared/SharedUI';

const App: React.FC = () => {
  const aura = useAura();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'stream' | 'chat' | 'vault' | 'settings'
  >('dashboard');
  const [vaultSubTab, setVaultSubTab] = useState<'identity' | 'knowledge'>('identity');
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

  // Verification Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentSourceId, setCurrentSourceId] = useState<string | null>(null);
  const [pendingFacts, setPendingFacts] = useState<CategorizedFact[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<ProposedUpdate[]>([]);

  const [toast, setToast] = useState<{
    message: string;
    type?: 'success' | 'info' | 'error';
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

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  if (!aura.isUnlocked) {
    return (
      <VaultLockView
        hasVault={aura.hasVault}
        hasLegacyData={aura.hasLegacyData}
        lockError={aura.lockError}
        onUnlock={aura.unlock}
        onSetup={aura.setupVault}
      />
    );
  }

  const handleLog = async (e: React.FormEvent, files?: File[]) => {
    if (e) e.preventDefault();
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
      const processed = (await aura.logMemory(inputToProcess, files)) as any;
      if (processed.facts?.length || processed.proposedUpdates?.length) {
        setPendingFacts(processed.facts || []);
        setPendingUpdates(processed.proposedUpdates || []);
        setCurrentSourceId(processed.sourceId);
        setIsSheetOpen(true);
      } else {
        showToast(processed.headline || 'Memory Internalized', 'success');
      }
      if (!processed?.needsReview) {
        setUserInput('');
      }
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

  const commitAll = () => {
    if (currentSourceId) aura.commitClaims(currentSourceId, pendingFacts, pendingUpdates);
    setIsSheetOpen(false);
    setPendingFacts([]);
    setPendingUpdates([]);
    setCurrentSourceId(null);
    showToast('Neural State Converged', 'success');
  };

  if (!aura.isOnboarded) {
    return (
      <OnboardingView
        profile={aura.profile}
        setProfile={aura.setProfile}
        ruleOfLife={aura.ruleOfLife}
        setRuleOfLife={aura.setRuleOfLife}
        onComplete={aura.completeOnboarding}
        logMemory={async (input) => aura.logMemory(input)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#02040a] text-slate-100 overflow-hidden font-inter dark">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        familySpace={aura.familySpace}
        activeUserId={aura.activeUserId}
        onSwitchUser={(id) => aura.setActiveUserId(id)}
        onAddMember={(name) => aura.addFamilyMember(name)}
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
            setVaultSubTab('identity');
          }}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {toast && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
            <div
              className={`px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-4 border backdrop-blur-md ${toast.type === 'error' ? 'bg-rose-600 border-rose-400/30' : 'bg-indigo-600 border-white/10'}`}
            >
              {toast.type === 'success' && <CheckCircle2 size={20} className="text-emerald-400" />}
              <span className="text-sm font-bold">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-1 hover:bg-white/20 p-1 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          <ErrorBoundary>
            <div
              key={`${activeTab}-${aura.activeUserId}`}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  {...(aura as any)}
                  memory={aura.memoryItems}
                  refreshAll={aura.refreshAura}
                  onNavigate={setActiveTab as any}
                />
              )}
              {activeTab === 'vault' && (
                <div className="space-y-12">
                  <div className="flex items-center bg-slate-900/60 p-1 rounded-2xl border border-slate-800 w-fit">
                    <button
                      onClick={() => setVaultSubTab('identity')}
                      className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${vaultSubTab === 'identity' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      <User size={14} /> Identity Node
                    </button>
                    <button
                      onClick={() => setVaultSubTab('knowledge')}
                      className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${vaultSubTab === 'knowledge' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Database size={14} /> Knowledge Graph
                    </button>
                  </div>
                  {vaultSubTab === 'identity' ? (
                    <VaultView
                      profile={aura.profile}
                      ruleOfLife={aura.ruleOfLife}
                      updateProfile={(s, f, v) =>
                        aura.setProfile((prev) => ({
                          ...prev,
                          [s]: { ...(prev as any)[s], [f]: v },
                        }))
                      }
                      updateRuleOfLife={aura.setRuleOfLife}
                      updateInnerCircle={(c) =>
                        aura.setProfile((prev) => ({ ...prev, innerCircle: c }))
                      }
                      onSync={aura.refreshAura}
                    />
                  ) : (
                    <MemoryVaultView
                      claims={aura.claims}
                      sources={aura.sources}
                      memoryItems={aura.memoryItems}
                      onApprove={aura.approveClaims}
                      onReject={aura.rejectClaims}
                      onResolve={aura.resolveConflict}
                      onDelete={aura.deleteClaim}
                      onUpdate={aura.updateClaim}
                    />
                  )}
                </div>
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
          </ErrorBoundary>
        </div>

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={setActiveTab}
          onSync={aura.refreshAura}
          onExport={aura.exportData}
          onReset={aura.clearAllData}
        />
        <VerificationSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          facts={pendingFacts}
          updates={pendingUpdates}
          members={aura.familySpace.members}
          onCommit={commitAll}
          onRejectFact={(idx) => setPendingFacts((prev) => prev.filter((_, i) => i !== idx))}
          onRejectUpdate={(idx) => setPendingUpdates((prev) => prev.filter((_, i) => i !== idx))}
        />
        <LogBar
          userInput={userInput}
          setUserInput={setUserInput}
          isProcessing={aura.isProcessing}
          logError={logError}
          onLog={handleLog}
          onExport={aura.exportData}
          onReset={aura.clearAllData}
        />
      </main>
    </div>
  );
};

export default App;
