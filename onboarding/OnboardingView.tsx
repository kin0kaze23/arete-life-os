import React, { useState } from 'react';
import {
  Cpu,
  ArrowRight,
  User,
  Compass,
  Target,
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  Activity,
  Wallet,
  Heart,
  Users,
  MapPin,
  Calendar,
  Globe,
  Shield,
  Check,
  X,
  Info,
} from 'lucide-react';
import { VaultInput, VaultSelect, VaultSlider, ChipInput } from '@/shared';
import { UserProfile, RuleOfLife } from '@/data';

const SUGGESTIONS = {
  status: [
    'Single',
    'Married',
    'Living Together',
    'Expecting',
    'Parent',
    'Divorced',
    'Widowed',
    'Other',
  ],
  interests: [
    'Coding',
    'Biohacking',
    'Stoicism',
    'Marathons',
    'Reading',
    'DIY',
    'Gaming',
    'History',
    'Meditation',
    'FinOps',
    'Urban Gardening',
    'AI Ethics',
    'Space Exploration',
    'Cooking',
    'Sustainability',
    'Other',
  ],
  conditions: [
    'None',
    'Anxiety',
    'ADHD',
    'Asthma',
    'Diabetes',
    'Hypertension',
    'Celiac',
    'Migraines',
    'IBS',
    'Depression',
    'Sleep Apnea',
    'Other',
  ],
  activity: [
    'Gym',
    'Running',
    'Walking',
    'Yoga',
    'Swimming',
    'Tennis',
    'Cycling',
    'Soccer',
    'Basketball',
    'Hiking',
    'Pilates',
    'Crossfit',
    'Other',
  ],
  medications: [
    'None',
    'Multivitamin',
    'Omega-3',
    'Magnesium',
    'Vitamin D',
    'Melatonin',
    'Probiotics',
    'Iron',
    'Creatine',
    'Metformin',
    'Lexapro',
    'Adderall',
    'Other',
  ],
  worldview: [
    'Secular',
    'Atheist',
    'Christian',
    'Jewish',
    'Muslim',
    'Stoic',
    'Spiritual',
    'Agnostic',
    'Buddhist',
    'Hindu',
    'Sikh',
    'Humanist',
    'Other',
  ],
  values: [
    'Freedom',
    'Integrity',
    'Excellence',
    'Kindness',
    'Sovereignty',
    'Courage',
    'Growth',
    'Family',
    'Truth',
    'Justice',
    'Humility',
    'Creativity',
    'Other',
  ],
  socialGoals: [
    'Deepen Marriage',
    'Meet Friends Weekly',
    'Call Parents Daily',
    'Networking',
    'Join a Community',
    'Better Conflict Resolution',
    'Dating',
    'Other',
  ],
  commitments: [
    'Work (Full-time)',
    'Work (Part-time)',
    'Caregiving',
    'Church/Religious Service',
    'Volunteering',
    'School/Study',
    'Commuting',
    'Household Management',
    'Other',
  ],
  livingArrangements: ['Alone', 'With Spouse', 'With Family', 'With Roommates', 'Other'],
  socialEnergy: ['Introverted', 'Balanced', 'Extroverted', 'Other'],
};

interface OnboardingViewProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  ruleOfLife: RuleOfLife;
  setRuleOfLife: React.Dispatch<React.SetStateAction<RuleOfLife>>;
  onComplete: () => void;
  logMemory: (input: string) => Promise<any>;
  runDeepInitialization?: () => Promise<string | void>;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  profile,
  setProfile,
  ruleOfLife,
  setRuleOfLife,
  onComplete,
  logMemory,
  runDeepInitialization,
}) => {
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const updateProfile = (section: keyof UserProfile, field: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...(prev as any)[section], [field]: value },
    }));
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await logMemory(
        'System Initialization sequence completed. Profile context fully calibrated.'
      );
      if (runDeepInitialization) {
        await runDeepInitialization();
      }
      onComplete();
    } catch (err) {
      onComplete();
    } finally {
      setIsFinishing(false);
    }
  };

  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-10">
      {[1, 2, 3, 4, 5, 6, 7].map((s) => (
        <div
          key={s}
          className={`h-1 rounded-full transition-all duration-500 ${s === step ? 'w-10 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : s < step ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-800'}`}
        ></div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#02040a] flex items-center justify-center p-6 font-inter overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/10 rounded-full blur-[150px] animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {renderProgress()}

        <div className="bg-[#0D1117]/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="space-y-6">
              <Header
                icon={<User className="text-indigo-400" />}
                title="Neural Identity"
                subtitle="Establish core identity markers for high-fidelity personalization."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VaultInput
                  label="Full Name"
                  value={profile.identify.name}
                  onChange={(v) => updateProfile('identify', 'name', v)}
                />
                <VaultInput
                  label="Date of Birth"
                  type="date"
                  value={profile.identify.birthday}
                  onChange={(v) => updateProfile('identify', 'birthday', v)}
                />
                <VaultInput
                  label="Current City/Country"
                  placeholder="e.g. London, UK"
                  value={profile.identify.location}
                  onChange={(v) => updateProfile('identify', 'location', v)}
                />
                <VaultInput
                  label="Grew Up In (Origin)"
                  placeholder="e.g. New York, USA"
                  value={profile.identify.origin}
                  onChange={(v) => updateProfile('identify', 'origin', v)}
                />
              </div>
              <VaultInput
                label="Ethnicity (Optional)"
                placeholder="e.g. Caucasian, Hispanic, Asian..."
                value={profile.identify.ethnicity}
                onChange={(v) => updateProfile('identify', 'ethnicity', v)}
              />
            </div>
          )}

          {/* STEP 2: PERSONAL */}
          {step === 2 && (
            <div className="space-y-6">
              <Header
                icon={<Compass className="text-rose-400" />}
                title="Contextual Layers"
                subtitle="Defining your current roles and social status."
              />
              <VaultSelect
                label="Relationship Status"
                value={profile.relationship.relationshipStatus || 'Single'}
                options={SUGGESTIONS.status}
                onChange={(v) => updateProfile('relationship', 'relationshipStatus', v)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VaultInput
                  label="Primary Job Role"
                  placeholder="e.g. Software Engineer"
                  value={profile.personal.jobRole}
                  onChange={(v) => updateProfile('personal', 'jobRole', v)}
                />
                <VaultInput
                  label="Company / Industry"
                  placeholder="e.g. Fintech"
                  value={profile.personal.company}
                  onChange={(v) => updateProfile('personal', 'company', v)}
                />
              </div>
              <ChipInput
                label="Interests & Hobbies"
                selected={profile.personal.interests}
                suggestions={SUGGESTIONS.interests}
                onUpdate={(items) => updateProfile('personal', 'interests', items)}
              />
            </div>
          )}

          {/* STEP 3: HEALTH */}
          {step === 3 && (
            <div className="space-y-6">
              <Header
                icon={<Heart className="text-emerald-400" />}
                title="Biometric Matrix"
                subtitle="Calibrate your physiological baseline for wellness tasks."
              />
              <div className="grid grid-cols-2 gap-6">
                <VaultInput
                  label="Height (cm)"
                  value={profile.health.height}
                  onChange={(v) => updateProfile('health', 'height', v)}
                />
                <VaultInput
                  label="Weight (kg)"
                  value={profile.health.weight}
                  onChange={(v) => updateProfile('health', 'weight', v)}
                />
                <VaultInput
                  label="Typical Bedtime"
                  type="time"
                  value={profile.health.sleepTime}
                  onChange={(v) => updateProfile('health', 'sleepTime', v)}
                />
                <VaultInput
                  label="Typical Wake-up"
                  type="time"
                  value={profile.health.wakeTime}
                  onChange={(v) => updateProfile('health', 'wakeTime', v)}
                />
              </div>
              <ChipInput
                label="Sports & Activity"
                selected={profile.health.activities}
                suggestions={SUGGESTIONS.activity}
                onUpdate={(items) => updateProfile('health', 'activities', items)}
              />
              <VaultSelect
                label="Activity Frequency"
                value={profile.health.activityFrequency}
                options={['Rarely', '1-2 days/week', '3-4 days/week', 'Daily', 'Other']}
                onChange={(v) => updateProfile('health', 'activityFrequency', v)}
              />
              <ChipInput
                label="Medical Conditions"
                selected={profile.health.conditions}
                suggestions={SUGGESTIONS.conditions}
                onUpdate={(items) => updateProfile('health', 'conditions', items)}
              />
              <ChipInput
                label="Vitamins / Medications"
                selected={profile.health.medications}
                suggestions={SUGGESTIONS.medications}
                onUpdate={(items) => updateProfile('health', 'medications', items)}
              />
            </div>
          )}

          {/* STEP 4: FINANCE */}
          {step === 4 && (
            <div className="space-y-6">
              <Header
                icon={<Wallet className="text-amber-400" />}
                title="Resource Engine"
                subtitle="Financial metrics for strategic resource planning."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VaultInput
                  label="Monthly Income"
                  placeholder="e.g. 5000"
                  value={profile.finances.income}
                  onChange={(v) => updateProfile('finances', 'income', v)}
                />
                <VaultInput
                  label="Total Liabilities"
                  placeholder="e.g. 200000"
                  value={profile.finances.liabilities}
                  onChange={(v) => updateProfile('finances', 'liabilities', v)}
                />
                <VaultInput
                  label="Monthly Fixed Costs"
                  placeholder="Rent, Bills..."
                  value={profile.finances.fixedCosts}
                  onChange={(v) => updateProfile('finances', 'fixedCosts', v)}
                />
                <VaultInput
                  label="Monthly Variable Costs"
                  placeholder="Food, Entertainment..."
                  value={profile.finances.variableCosts}
                  onChange={(v) => updateProfile('finances', 'variableCosts', v)}
                />
              </div>
              <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-4">
                <VaultInput
                  label="Total Net Worth Assets"
                  placeholder="Aggregated net worth"
                  value={profile.finances.assetsTotal}
                  onChange={(v) => updateProfile('finances', 'assetsTotal', v)}
                />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">
                  Optional Asset Breakdown
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <VaultInput
                    label="Cash"
                    value={profile.finances.assetsBreakdown.cash}
                    onChange={(v) =>
                      updateProfile('finances', 'assetsBreakdown', {
                        ...profile.finances.assetsBreakdown,
                        cash: v,
                      })
                    }
                  />
                  <VaultInput
                    label="Investments"
                    value={profile.finances.assetsBreakdown.investments}
                    onChange={(v) =>
                      updateProfile('finances', 'assetsBreakdown', {
                        ...profile.finances.assetsBreakdown,
                        investments: v,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: RELATIONSHIP */}
          {step === 5 && (
            <div className="space-y-6">
              <Header
                icon={<Users className="text-cyan-400" />}
                title="Social Topology"
                subtitle="Calibrate your relational grid and social energy."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VaultSelect
                  label="Living Arrangement"
                  value={profile.relationship.livingArrangement}
                  options={SUGGESTIONS.livingArrangements}
                  onChange={(v) => updateProfile('relationship', 'livingArrangement', v)}
                />
                <VaultSelect
                  label="Social Energy"
                  value={profile.relationship.socialEnergy}
                  options={SUGGESTIONS.socialEnergy}
                  onChange={(v) => updateProfile('relationship', 'socialEnergy', v)}
                />
              </div>
              <ChipInput
                label="Daily Commitments"
                selected={profile.relationship.dailyCommitments}
                suggestions={SUGGESTIONS.commitments}
                onUpdate={(items) => updateProfile('relationship', 'dailyCommitments', items)}
              />
              <ChipInput
                label="Social Goals"
                selected={profile.relationship.socialGoals}
                suggestions={SUGGESTIONS.socialGoals}
                onUpdate={(items) => updateProfile('relationship', 'socialGoals', items)}
              />
            </div>
          )}

          {/* STEP 6: SPIRITUAL */}
          {step === 6 && (
            <div className="space-y-6">
              <Header
                icon={<Globe className="text-indigo-400" />}
                title="Axiological Base"
                subtitle="The core values and worldview governing your system."
              />
              <VaultSelect
                label="Worldview / Belief System"
                value={profile.spiritual.worldview}
                options={SUGGESTIONS.worldview}
                onChange={(v) => updateProfile('spiritual', 'worldview', v)}
              />
              <ChipInput
                label="Core Values"
                selected={profile.spiritual.coreValues}
                suggestions={SUGGESTIONS.values}
                onUpdate={(items) => updateProfile('spiritual', 'coreValues', items)}
              />
              <VaultSelect
                label="Practice Pulse (Frequency)"
                value={profile.spiritual.practicePulse}
                options={['Daily', 'Weekly', 'Monthly', 'Occasionally', 'Rarely', 'Other']}
                onChange={(v) => updateProfile('spiritual', 'practicePulse', v)}
              />
            </div>
          )}

          {/* STEP 7: ACTIVATION */}
          {step === 7 && (
            <div className="space-y-10 text-center py-10">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)] animate-pulse">
                  <ShieldCheck size={48} className="text-indigo-400" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                  Kernel Calibrated
                </h2>
                <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  Your Identity Vault is synchronized. Aura is now capable of high-fidelity analysis
                  across all life domains.
                </p>
              </div>
              <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Privacy Protocol
                  </span>
                  <Shield size={14} className="text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-500 text-left">
                  All profile data is stored locally within your encrypted browser environment. No
                  raw data leaves this device.
                </p>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div className="flex gap-4 pt-6 border-t border-white/5">
            {step > 1 && step < 7 && (
              <button
                onClick={prevStep}
                className="flex-1 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 7 ? handleFinish : nextStep}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              {isFinishing
                ? 'Initializing...'
                : step === 7
                  ? 'Activate System'
                  : 'Confirm & Proceed'}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* SKIP FOR SENSITIVE FIELDS */}
          {step < 7 && (
            <button
              onClick={nextStep}
              className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:text-slate-500 transition-colors"
            >
              Skip for later (Reduces personalization precision)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
  icon,
  title,
  subtitle,
}) => (
  <div className="flex items-center gap-5">
    <div className="p-4 bg-slate-900 rounded-3xl border border-white/5 shadow-inner">{icon}</div>
    <div className="text-left">
      <h2 className="text-2xl font-black tracking-tight text-white uppercase italic leading-none mb-1">
        {title}
      </h2>
      <p className="text-slate-500 text-xs font-medium">{subtitle}</p>
    </div>
  </div>
);
