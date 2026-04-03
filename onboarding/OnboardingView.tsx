import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, RuleOfLife } from '@/data';
import { VaultInput, VaultSelect, ChipInput } from '@/shared';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingViewProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  ruleOfLife: RuleOfLife;
  setRuleOfLife: React.Dispatch<React.SetStateAction<RuleOfLife>>;
  onComplete: () => void;
  logMemory: (input: string) => Promise<any>;
  runDeepInitialization?: () => Promise<string | void>;
}

const TABS = [
  { id: 1, label: 'Identity', color: 'bg-white' },
  { id: 2, label: 'Health', color: 'bg-[var(--dim-health)]' },
  { id: 3, label: 'Finance', color: 'bg-[var(--dim-finance)]' },
  { id: 4, label: 'Relationships', color: 'bg-[var(--dim-relationships)]' },
  { id: 5, label: 'Spiritual', color: 'bg-[var(--dim-spiritual)]' },
  { id: 6, label: 'Personal', color: 'bg-[var(--dim-personal)]' },
];

const LOADING_STAGES = [
  { label: 'Reading your health profile...', color: 'var(--dim-health)', pct: 20 },
  { label: 'Mapping your financial picture...', color: 'var(--dim-finance)', pct: 40 },
  { label: 'Understanding your relationships...', color: 'var(--dim-relationships)', pct: 60 },
  { label: 'Reflecting your values & purpose...', color: 'var(--dim-spiritual)', pct: 80 },
  { label: 'Personalizing your Life Pulse...', color: 'var(--dim-personal)', pct: 96 },
];

const OnboardingLoader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (phase < LOADING_STAGES.length - 1) {
      const t = setTimeout(() => setPhase((p) => p + 1), 900);
      return () => clearTimeout(t);
    } else {
      // All stages shown — wait a moment then finish
      const t = setTimeout(() => onComplete(), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  const current = LOADING_STAGES[phase];

  return (
    <motion.div
      className="w-full flex flex-col items-center justify-center min-h-[70vh] px-4 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Ambient glow that follows the active dimension */}
      <motion.div
        key={phase}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: current.color }}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 0.8 }}
      />

      {/* Pulsing orb */}
      <div className="relative mb-12">
        <motion.div
          className="w-24 h-24 rounded-full border-2 border-white/10"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Spinning arc */}
        <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke={current.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - current.pct / 100) }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </svg>
        {/* Percentage inside */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={current.pct}
            className="text-xl font-black text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {current.pct}%
          </motion.span>
        </div>
      </div>

      {/* Stage label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          className="text-lg md:text-xl font-medium text-white/80 max-w-sm leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45 }}
        >
          {current.label}
        </motion.p>
      </AnimatePresence>

      {/* Dot trail showing progress */}
      <div className="flex gap-3 mt-10">
        {LOADING_STAGES.map((s, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: i <= phase ? s.color : 'rgba(255,255,255,0.15)' }}
            animate={{ scale: i === phase ? 1.5 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <p className="text-white/30 text-xs font-medium mt-8 tracking-widest uppercase">
        Building your Life Pulse...
      </p>
    </motion.div>
  );
};

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  profile,
  setProfile,
  onComplete,
  logMemory,
  runDeepInitialization,
}) => {
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 7));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const updateProfile = (section: keyof UserProfile, field: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...(prev as any)[section], [field]: value },
    }));
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await logMemory('Profile calibrated from Onboarding');
      if (runDeepInitialization) {
        await runDeepInitialization();
      }
      onComplete();
    } catch {
      onComplete();
    }
  };

  const renderProgress = () => (
    <div className="w-full max-w-2xl mx-auto mb-10">
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3 px-2">
        <span>Help Arete Understand You</span>
        <span>{Math.round((Math.min(step, 6) / 6) * 100)}%</span>
      </div>
      <div className="flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        {TABS.map((tab) => {
          const isActive = step >= tab.id;
          return (
            <motion.div
              key={tab.id}
              className={`h-full ${tab.color}`}
              initial={{ width: '0%', opacity: 0 }}
              animate={{
                width: `${100 / TABS.length}%`,
                opacity: isActive ? 1 : 0.1,
              }}
              transition={{ duration: 0.5 }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-3 px-2 text-[10px] sm:text-xs">
        {TABS.map((tab) => (
          <span
            key={tab.id}
            className={`font-semibold transition-colors ${step >= tab.id ? 'text-white' : 'text-white/30 hidden sm:block'}`}
          >
            {tab.label}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full relative z-[100] text-white flex flex-col bg-black/40 backdrop-blur-md">
      {/* Top Margin & Progress */}
      <div className="pt-12 md:pt-16 px-4 md:px-8 flex-none w-full max-w-4xl mx-auto">
        {step < 7 && renderProgress()}
      </div>

      {/* Main Content Area (Natural Window Scroll instead of fixed inner scroll) */}
      <div
        className={`flex-1 w-full mx-auto px-4 md:px-8 pb-48 pt-10 flex flex-col justify-center ${step === 7 ? 'max-w-4xl items-center' : 'max-w-2xl'}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-[80vh] min-h-[400px] flex flex-col"
          >
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <div className="space-y-8 glass-panel p-6 md:p-10 border border-white/10 mt-auto mb-auto">
                <div className="space-y-2 mb-8">
                  <h2 className="text-3xl font-black tracking-tight">
                    Let's start with the basics
                  </h2>
                  <p className="text-white/60">A few details to personalize your experience.</p>
                </div>

                <VaultInput
                  label="What's your name?"
                  placeholder="e.g. Alex"
                  value={profile.identify.name}
                  onChange={(v) => updateProfile('identify', 'name', v)}
                />
                <VaultInput
                  label="Where do you live?"
                  placeholder="e.g. London, UK"
                  value={profile.identify.location}
                  onChange={(v) => updateProfile('identify', 'location', v)}
                />
                <VaultSelect
                  label="How old are you?"
                  value={profile.identify.birthday}
                  options={['20s', '30s', '40s', '50s+']}
                  onChange={(v) => updateProfile('identify', 'birthday', v)}
                />
              </div>
            )}

            {/* STEP 2: HEALTH */}
            {step === 2 && (
              <div className="space-y-8 glass-panel p-6 md:p-10 border border-[var(--dim-health)]/30 mt-auto mb-auto">
                <div className="space-y-2 mb-8">
                  <h2 className="text-3xl font-black tracking-tight">Your Health Focus</h2>
                </div>

                <VaultInput
                  label="What time do you wake up?"
                  type="time"
                  value={profile.health.wakeTime}
                  onChange={(v) => updateProfile('health', 'wakeTime', v)}
                />
                <VaultInput
                  label="What time do you go to sleep?"
                  type="time"
                  value={profile.health.sleepTime}
                  onChange={(v) => updateProfile('health', 'sleepTime', v)}
                />
                <VaultSelect
                  label="How active are you?"
                  value={profile.health.activityFrequency}
                  options={['Sedentary', 'Light', 'Moderate', 'Active']}
                  onChange={(v) => updateProfile('health', 'activityFrequency', v)}
                />
                <ChipInput
                  label="What do you want to improve?"
                  selected={profile.health.conditions}
                  suggestions={[
                    'Joint Recovery',
                    'Sleep Optimization',
                    'Energy Levels',
                    'Postural Correction',
                    'Endurance',
                    'Flexibility',
                  ]}
                  onUpdate={(items) => updateProfile('health', 'conditions', items)}
                />
              </div>
            )}

            {/* STEP 3: FINANCE */}
            {step === 3 && (
              <div className="space-y-8 glass-panel p-6 md:p-10 border border-[var(--dim-finance)]/30 mt-auto mb-auto">
                <div className="space-y-2 mb-8">
                  <h2 className="text-3xl font-black tracking-tight">Your Finances</h2>
                </div>

                <VaultSelect
                  label="Monthly Income Range?"
                  value={profile.finances.income}
                  options={['<$3k', '$3-5k', '$5-10k', '$10k+']}
                  onChange={(v) => updateProfile('finances', 'income', v)}
                />
                <VaultInput
                  label="Monthly Bills (Rent, Loans, etc.)"
                  placeholder="e.g. $1500"
                  value={profile.finances.fixedCosts}
                  onChange={(v) => updateProfile('finances', 'fixedCosts', v)}
                />
                <VaultInput
                  label="Monthly Spending (Food, Fun, etc.)"
                  placeholder="e.g. $800"
                  value={profile.finances.variableCosts}
                  onChange={(v) => updateProfile('finances', 'variableCosts', v)}
                />
                <VaultSelect
                  label="Goal: How much to save?"
                  value={profile.finances.investmentStrategy || ''}
                  options={['10%', '20%', '30%+']}
                  onChange={(v) => updateProfile('finances', 'investmentStrategy', v)}
                />
              </div>
            )}

            {/* STEP 4: RELATIONSHIPS */}
            {step === 4 && (
              <div className="space-y-8 glass-panel p-6 md:p-10 border border-[var(--dim-relationships)]/30 mt-auto mb-auto">
                <div className="space-y-2 mb-8">
                  <h2 className="text-3xl font-black tracking-tight">Your Social Life</h2>
                </div>

                <VaultSelect
                  label="Relationship Status?"
                  value={profile.relationship.relationshipStatus}
                  options={['Single', 'Dating', 'Committed', 'Married']}
                  onChange={(v) => updateProfile('relationship', 'relationshipStatus', v)}
                />
                <VaultSelect
                  label="Who do you live with?"
                  value={profile.relationship.livingArrangement}
                  options={['Alone', 'Partner', 'Family', 'Roommates']}
                  onChange={(v) => updateProfile('relationship', 'livingArrangement', v)}
                />
                <VaultSelect
                  label="Social Energy?"
                  value={profile.relationship.socialEnergy}
                  options={['Introvert', 'Ambivert', 'Extrovert']}
                  onChange={(v) => updateProfile('relationship', 'socialEnergy', v)}
                />
                <ChipInput
                  label="What are your social goals?"
                  selected={profile.relationship.socialGoals}
                  suggestions={[
                    'Deepen Friendships',
                    'Find a Partner',
                    'More Quality Time',
                    'Networking',
                    'Boundaries',
                  ]}
                  onUpdate={(items) => updateProfile('relationship', 'socialGoals', items)}
                />
              </div>
            )}

            {/* STEP 5: SPIRITUAL */}
            {step === 5 && (
              <div className="space-y-8 glass-panel p-6 md:p-10 border border-[var(--dim-spiritual)]/30 mt-auto mb-auto">
                <div className="space-y-2 mb-8">
                  <h2 className="text-3xl font-black tracking-tight">Your Values</h2>
                </div>

                <VaultSelect
                  label="Do you practice a religion?"
                  value={profile.spiritual.worldview}
                  options={['Yes', 'No']}
                  onChange={(v) => updateProfile('spiritual', 'worldview', v)}
                />
                <ChipInput
                  label="What values guide you?"
                  selected={profile.spiritual.coreValues}
                  suggestions={[
                    'Freedom',
                    'Integrity',
                    'Excellence',
                    'Family',
                    'Truth',
                    'Kindness',
                  ]}
                  onUpdate={(items) => updateProfile('spiritual', 'coreValues', items)}
                />
                <VaultInput
                  label="What gives your life meaning?"
                  placeholder="e.g. Helping others, creating art"
                  value={profile.spiritual.practicePulse}
                  onChange={(v) => updateProfile('spiritual', 'practicePulse', v)}
                />
              </div>
            )}

            {/* STEP 6: PERSONAL */}
            {step === 6 && (
              <div className="space-y-8 glass-panel p-6 md:p-10 border border-[var(--dim-personal)]/30 mt-auto mb-auto">
                <div className="space-y-2 mb-8">
                  <h2 className="text-3xl font-black tracking-tight">Work & Growth</h2>
                </div>

                <VaultInput
                  label="What's your job title?"
                  placeholder="e.g. Designer"
                  value={profile.personal.jobRole}
                  onChange={(v) => updateProfile('personal', 'jobRole', v)}
                />
                <VaultInput
                  label="What industry are you in?"
                  placeholder="e.g. Tech"
                  value={profile.personal.company}
                  onChange={(v) => updateProfile('personal', 'company', v)}
                />
                <ChipInput
                  label="What are your hobbies?"
                  selected={profile.personal.interests}
                  suggestions={['Reading', 'Coding', 'Fitness', 'Music', 'Travel', 'Art']}
                  onUpdate={(items) => updateProfile('personal', 'interests', items)}
                />
                <ChipInput
                  label="What skill are you building?"
                  selected={
                    profile.personal.personalityType ? [profile.personal.personalityType] : []
                  }
                  suggestions={[
                    'Leadership',
                    'Public Speaking',
                    'Design',
                    'Engineering',
                    'Writing',
                  ]}
                  onUpdate={(items) => updateProfile('personal', 'personalityType', items[0] || '')}
                />
              </div>
            )}

            {/* FINAL LOADING — auto-fires handleFinish */}
            {step === 7 && <OnboardingLoader onComplete={handleFinish} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER ACTION BAR */}
      {step < 7 && (
        <div className="fixed bottom-0 left-0 w-full p-4 md:p-8 bg-black/50 backdrop-blur-md border-t border-white/5 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={prevStep}
              className={`p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextStep}
              className="bg-white text-black px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
