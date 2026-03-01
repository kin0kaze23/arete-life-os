import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
} from 'lucide-react';
import { ChipInput, VaultInput, VaultSelect } from '@/shared';
import { RuleOfLife, UserProfile } from '@/data';

const SUGGESTIONS = {
  status: ['Single', 'Married', 'Living Together', 'Parent', 'Dating', 'Other'],
  activityFrequency: ['Rarely', '1-2 days/week', '3-4 days/week', 'Daily', 'Other'],
  conditions: ['None', 'Anxiety', 'ADHD', 'Asthma', 'Diabetes', 'Hypertension', 'Other'],
  socialEnergy: ['Introverted', 'Balanced', 'Extroverted', 'Other'],
  values: ['Freedom', 'Integrity', 'Excellence', 'Kindness', 'Growth', 'Family', 'Truth', 'Other'],
  interests: ['Coding', 'Biohacking', 'Reading', 'Meditation', 'Investing', 'Fitness', 'Travel', 'Other'],
  worldview: ['Secular', 'Christian', 'Spiritual', 'Stoic', 'Agnostic', 'Other'],
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

const detectGoalSignals = (goal: string) => {
  const text = goal.toLowerCase();
  const matches: string[] = [];
  if (text.match(/\b(health|sleep|weight|fitness|gym|exercise|energy)\b/)) matches.push('Health');
  if (text.match(/\b(career|job|business|client|project|promotion|build|ship)\b/)) matches.push('Personal');
  if (text.match(/\b(money|finance|invest|save|income|debt|budget)\b/)) matches.push('Finance');
  if (text.match(/\b(relationship|partner|family|friend|network|community)\b/)) matches.push('Relationships');
  if (text.match(/\b(spiritual|faith|god|pray|church|meaning|meditation)\b/)) matches.push('Spiritual');
  return matches;
};

const deriveSeason = (goal: string) => {
  const signals = detectGoalSignals(goal);
  const primary = signals[0] || 'Personal';
  const seasonName =
    primary === 'Health'
      ? 'Health Reset'
      : primary === 'Finance'
        ? 'Capital Discipline'
        : primary === 'Relationships'
          ? 'Relationship Repair'
          : primary === 'Spiritual'
            ? 'Inner Alignment'
            : 'Focused Build';
  return {
    seasonName,
    intensity: goal.trim().length > 120 ? 8 : goal.trim().length > 40 ? 7 : 6,
    signals,
  };
};

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  profile,
  setProfile,
  ruleOfLife,
  setRuleOfLife,
  onComplete,
  logMemory,
  runDeepInitialization,
}) => {
  const [isFinishing, setIsFinishing] = useState(false);
  const [goal, setGoal] = useState(() => {
    const context = ruleOfLife?.season?.context || '';
    return context === 'Standard operational focus.' ? '' : context;
  });
  const seasonPreview = useMemo(() => deriveSeason(goal), [goal]);

  const updateProfile = (section: keyof UserProfile, field: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...(prev as any)[section], [field]: value },
    }));
  };

  const completeSetup = async () => {
    setIsFinishing(true);
    try {
      if (goal.trim()) {
        const derived = deriveSeason(goal);
        setRuleOfLife((prev) => ({
          ...prev,
          season: {
            name: derived.seasonName,
            intensity: derived.intensity,
            context: goal.trim(),
          },
          valuesRoles: {
            ...prev.valuesRoles,
            roles: profile.personal.jobRole
              ? Array.from(new Set([profile.personal.jobRole, ...prev.valuesRoles.roles]))
              : prev.valuesRoles.roles,
            values:
              profile.spiritual.coreValues.length > 0
                ? profile.spiritual.coreValues
                : prev.valuesRoles.values,
          },
        }));
        await logMemory(`90-day focus: ${goal.trim()}`);
      }
      await logMemory('Initialisation complete. Core profile baselines confirmed.');
      if (runDeepInitialization) {
        await runDeepInitialization();
      }
      onComplete();
    } catch {
      onComplete();
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#02040a] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Initialisation
            </p>
            <h1 className="mt-2 text-[2.7rem] font-semibold tracking-[-0.05em] text-white">
              Start with the next 90 days.
            </h1>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-7 text-slate-300">
              Define the outcome you care about, confirm a few essential baselines, and Aura will use
              that context to shape your first guidance loop.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Privacy
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">
              This stays local in your encrypted vault. Only the guidance you choose to send will reach
              Telegram.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="space-y-6">
            <section className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,22,31,0.95),rgba(10,14,21,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] xl:p-7">
              <div className="flex items-start gap-4">
                <div className="rounded-[24px] border border-[#86a8ff]/20 bg-[#86a8ff]/[0.08] p-4 text-[#9ab7ff]">
                  <Target size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    The Spark
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
                    What is your primary goal for the next 90 days?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Write it in plain language. Aura will use this to frame your first season without
                    guessing hidden profile details.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/8 bg-black/20 p-4">
                <textarea
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="Examples: Build a stronger health baseline, pay down debt, ship my next product, repair my relationship with my partner."
                  className="min-h-[180px] w-full resize-none rounded-[20px] border border-white/8 bg-[#0b1017] px-5 py-4 text-[15px] leading-7 text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#86a8ff]/50"
                />
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
                <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Detected focus
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {seasonPreview.signals.length > 0 ? (
                      seasonPreview.signals.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200"
                        >
                          {signal}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        Add a short goal and Aura will anchor your first season around it.
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#86a8ff]/20 bg-[#86a8ff]/[0.08] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Season preview
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{seasonPreview.seasonName}</p>
                  <p className="mt-1 text-sm text-slate-300">Intensity {seasonPreview.intensity}/10</p>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <ProfileCard
                icon={<BrainCircuit size={18} />}
                title="Identity essentials"
                subtitle="Enough to personalize without slowing you down."
              >
                <div className="grid gap-4">
                  <VaultInput
                    label="Full name"
                    value={profile.identify.name}
                    onChange={(v) => updateProfile('identify', 'name', v)}
                  />
                  <VaultInput
                    label="Current city / country"
                    value={profile.identify.location}
                    placeholder="e.g. London, UK"
                    onChange={(v) => updateProfile('identify', 'location', v)}
                  />
                  <VaultInput
                    label="Primary role"
                    value={profile.personal.jobRole}
                    placeholder="e.g. Product operator"
                    onChange={(v) => updateProfile('personal', 'jobRole', v)}
                  />
                </div>
              </ProfileCard>

              <ProfileCard
                icon={<Wallet size={18} />}
                title="Resource baseline"
                subtitle="Needed for practical planning and risk detection."
              >
                <div className="grid gap-4">
                  <VaultInput
                    label="Monthly income"
                    value={profile.finances.income}
                    placeholder="e.g. 8500 USD"
                    onChange={(v) => updateProfile('finances', 'income', v)}
                  />
                  <VaultInput
                    label="Fixed costs"
                    value={profile.finances.fixedCosts}
                    placeholder="e.g. rent + bills"
                    onChange={(v) => updateProfile('finances', 'fixedCosts', v)}
                  />
                  <VaultInput
                    label="Variable costs"
                    value={profile.finances.variableCosts}
                    placeholder="e.g. food, travel, misc"
                    onChange={(v) => updateProfile('finances', 'variableCosts', v)}
                  />
                </div>
              </ProfileCard>

              <ProfileCard
                icon={<Activity size={18} />}
                title="Health baseline"
                subtitle="Needed for energy-aware guidance."
              >
                <div className="grid gap-4">
                  <VaultInput
                    label="Weight"
                    value={profile.health.weight}
                    placeholder="e.g. 74 kg"
                    onChange={(v) => updateProfile('health', 'weight', v)}
                  />
                  <VaultSelect
                    label="Activity frequency"
                    value={profile.health.activityFrequency}
                    options={SUGGESTIONS.activityFrequency}
                    onChange={(v) => updateProfile('health', 'activityFrequency', v)}
                  />
                  <ChipInput
                    label="Conditions / recurring symptoms"
                    selected={profile.health.conditions}
                    suggestions={SUGGESTIONS.conditions}
                    onUpdate={(items) => updateProfile('health', 'conditions', items)}
                  />
                </div>
              </ProfileCard>

              <ProfileCard
                icon={<Users size={18} />}
                title="Human context"
                subtitle="Helps Aura ask better questions, not just harder ones."
              >
                <div className="grid gap-4">
                  <VaultSelect
                    label="Relationship status"
                    value={profile.relationship.relationshipStatus || 'Single'}
                    options={SUGGESTIONS.status}
                    onChange={(v) => updateProfile('relationship', 'relationshipStatus', v)}
                  />
                  <VaultSelect
                    label="Social energy"
                    value={profile.relationship.socialEnergy}
                    options={SUGGESTIONS.socialEnergy}
                    onChange={(v) => updateProfile('relationship', 'socialEnergy', v)}
                  />
                  <ChipInput
                    label="Core values"
                    selected={profile.spiritual.coreValues}
                    suggestions={SUGGESTIONS.values}
                    onUpdate={(items) => updateProfile('spiritual', 'coreValues', items)}
                  />
                </div>
              </ProfileCard>
            </section>
          </div>

          <div className="space-y-6">
            <ProfileCard
              icon={<Sparkles size={18} />}
              title="Optional context"
              subtitle="Useful, but not required to start using the system today."
            >
              <div className="grid gap-4">
                <VaultInput
                  label="Company / industry"
                  value={profile.personal.company}
                  placeholder="e.g. Fintech"
                  onChange={(v) => updateProfile('personal', 'company', v)}
                />
                <ChipInput
                  label="Interests"
                  selected={profile.personal.interests}
                  suggestions={SUGGESTIONS.interests}
                  onUpdate={(items) => updateProfile('personal', 'interests', items)}
                />
                <VaultSelect
                  label="Worldview"
                  value={profile.spiritual.worldview}
                  options={SUGGESTIONS.worldview}
                  onChange={(v) => updateProfile('spiritual', 'worldview', v)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <VaultInput
                    label="Sleep time"
                    type="time"
                    value={profile.health.sleepTime}
                    onChange={(v) => updateProfile('health', 'sleepTime', v)}
                  />
                  <VaultInput
                    label="Wake time"
                    type="time"
                    value={profile.health.wakeTime}
                    onChange={(v) => updateProfile('health', 'wakeTime', v)}
                  />
                </div>
              </div>
            </ProfileCard>

            <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,22,31,0.95),rgba(10,14,21,0.92))] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
              <div className="flex items-start gap-4">
                <div className="rounded-[20px] border border-emerald-300/20 bg-emerald-500/[0.08] p-3 text-emerald-200">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Ready state
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-100">Good enough to start</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    You do not need a perfect profile before journaling. The guidance loop will keep
                    asking for the missing pieces over time.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => void completeSetup()}
                  className="flex w-full items-center justify-center gap-3 rounded-[20px] bg-[#86a8ff] px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-[#9ab7ff]"
                >
                  {isFinishing ? 'Initializing...' : 'Activate System'}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => void completeSetup()}
                  className="w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  Use defaults for now
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,22,31,0.95),rgba(10,14,21,0.92))] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
    <div className="flex items-start gap-4">
      <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3 text-slate-200">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
      </div>
    </div>
    <div className="mt-5 space-y-4">{children}</div>
  </section>
);
