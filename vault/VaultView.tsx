import React, { useState } from 'react';
import {
  User,
  Activity,
  Landmark,
  Globe,
  Briefcase,
  Compass,
  Zap,
  Award,
  Target,
  Users,
  Shield,
  Heart,
  Wallet,
  Scale,
  Brain,
  Star,
  ChevronRight,
  LayoutGrid,
  AlertCircle,
} from 'lucide-react';
import {
  VaultInput,
  VaultSelect,
  VaultSection,
  ChipInput,
  VaultSlider,
  getProfileCompletion,
  ProfileCompletionRing,
} from '@/shared';
import { UserProfile, RelationshipContact, RuleOfLife, Category } from '@/data';

interface VaultViewProps {
  profile: UserProfile;
  ruleOfLife: RuleOfLife;
  updateProfile: (section: keyof UserProfile, field: string, value: any) => void;
  updateRuleOfLife: (newRule: RuleOfLife) => void;
  updateInnerCircle: (contacts: RelationshipContact[]) => void;
  onSync: () => void;
}

const STALE_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days

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
  roles: [
    'Founder',
    'Parent',
    'Student',
    'Artist',
    'Athlete',
    'Mentor',
    'Architect',
    'Researcher',
    'Leader',
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

export const VaultView: React.FC<VaultViewProps> = ({
  profile,
  ruleOfLife,
  updateProfile,
  updateRuleOfLife,
  updateInnerCircle,
  onSync,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('season');

  const hSet = (field: string, v: any) => updateProfile('health', field, v);
  const iSet = (field: string, v: any) => updateProfile('identify', field, v);
  const pSet = (field: string, v: any) => updateProfile('personal', field, v);
  const fSet = (field: string, v: any) => updateProfile('finances', field, v);
  const rSet = (field: string, v: any) => updateProfile('relationship', field, v);
  const sSet = (field: string, v: any) => updateProfile('spiritual', field, v);

  const setSeason = (field: string, v: any) =>
    updateRuleOfLife({ ...ruleOfLife, season: { ...ruleOfLife.season, [field]: v } });
  const setRoles = (roles: string[]) =>
    updateRuleOfLife({ ...ruleOfLife, valuesRoles: { ...ruleOfLife.valuesRoles, roles } });
  const setValues = (values: string[]) =>
    updateRuleOfLife({ ...ruleOfLife, valuesRoles: { ...ruleOfLife.valuesRoles, values } });

  const completion = getProfileCompletion(profile);

  const isStale = (timestamp?: number) => {
    if (!timestamp) return false;
    return Date.now() - timestamp > STALE_THRESHOLD;
  };

  const sections = [
    {
      id: 'season',
      title: 'Life Season',
      icon: <Compass />,
      color: 'text-rose-400',
      lastUpdated: Date.now(),
    },
    {
      id: 'identify',
      title: 'Primary Nodes',
      icon: <User />,
      color: 'text-indigo-400',
      lastUpdated: profile.identify.lastUpdated,
    },
    {
      id: 'social',
      title: 'Social Context',
      icon: <Briefcase />,
      color: 'text-cyan-400',
      lastUpdated: profile.personal.lastUpdated,
    },
    {
      id: 'health',
      title: 'Biological Matrix',
      icon: <Activity />,
      color: 'text-emerald-400',
      lastUpdated: profile.health.lastUpdated,
    },
    {
      id: 'finance',
      title: 'Resource Engine',
      icon: <Landmark />,
      color: 'text-amber-400',
      lastUpdated: profile.finances.lastUpdated,
    },
    {
      id: 'spiritual',
      title: 'Ethical Root',
      icon: <Globe />,
      color: 'text-indigo-400',
      lastUpdated: profile.spiritual.lastUpdated,
    },
    {
      id: 'relational',
      title: 'Relational Grid',
      icon: <Users />,
      color: 'text-cyan-400',
      lastUpdated: profile.relationship.lastUpdated,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] animate-in fade-in duration-500">
      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-72 flex-shrink-0 space-y-6 overflow-y-auto pr-2 no-scrollbar pb-20">
        {/* Identity Card */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] text-center shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative inline-block mb-4">
            <ProfileCompletionRing profile={profile} size={80} strokeWidth={4} showText={false} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-white">{completion.overall}%</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-white">{profile.identify.name || 'User'}</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
            {profile.personal.jobRole || 'Architect'}
          </p>
        </div>

        {/* Navigation */}
        <div className="space-y-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveCategory(s.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                activeCategory === s.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
                  : 'bg-slate-900/20 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400'
              }`}
            >
              <div className="flex items-center gap-3">
                {React.cloneElement(s.icon as React.ReactElement<any>, { size: 16 })}
                <span className="text-xs font-bold uppercase tracking-wider">{s.title}</span>
              </div>
              {activeCategory === s.id && <ChevronRight size={14} />}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-white/5">
          <button
            onClick={onSync}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Zap size={14} /> Force Sync
          </button>
        </div>
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 overflow-y-auto pr-2 pb-40 no-scrollbar">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="p-8 bg-slate-900/20 border border-white/5 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              {sections.find((s) => s.id === activeCategory)?.icon &&
                React.cloneElement(
                  sections.find((s) => s.id === activeCategory)!.icon as React.ReactElement<any>,
                  { size: 100 }
                )}
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter mb-2 relative z-10">
              {sections.find((s) => s.id === activeCategory)?.title}
            </h2>
            <p className="text-slate-500 text-sm font-medium relative z-10">
              Configure your {sections.find((s) => s.id === activeCategory)?.title.toLowerCase()}{' '}
              signals.
            </p>
          </div>

          <div className="animate-in slide-in-from-bottom-4 duration-300">
            {/* Render Active Form */}
            {activeCategory === 'season' && (
              <VaultSection icon={<Compass />} title="Life Season" color="text-rose-400">
                <div className="col-span-full md:col-span-1">
                  <VaultInput
                    label="Current Season"
                    value={ruleOfLife.season.name}
                    onChange={(v) => setSeason('name', v)}
                  />
                </div>
                <div className="col-span-full md:col-span-1">
                  <VaultSlider
                    label="Intensity Level"
                    value={ruleOfLife.season.intensity}
                    min={1}
                    max={10}
                    onChange={(v) => setSeason('intensity', parseInt(v))}
                  />
                </div>
                <div className="col-span-full">
                  <VaultInput
                    label="Strategic Context"
                    value={ruleOfLife.season.context}
                    onChange={(v) => setSeason('context', v)}
                  />
                </div>
              </VaultSection>
            )}

            {activeCategory === 'identify' && (
              <VaultSection
                icon={<User />}
                title="Primary Nodes"
                color="text-indigo-400"
                isStale={isStale(profile.identify.lastUpdated)}
              >
                <VaultInput
                  label="Full Name"
                  value={profile.identify.name}
                  onChange={(v) => iSet('name', v)}
                />
                <VaultInput
                  label="Date of Birth"
                  type="date"
                  value={profile.identify.birthday}
                  onChange={(v) => iSet('birthday', v)}
                />
                <VaultInput
                  label="Current Location"
                  value={profile.identify.location}
                  onChange={(v) => iSet('location', v)}
                />
                <VaultInput
                  label="Origin (Grew up in)"
                  value={profile.identify.origin}
                  onChange={(v) => iSet('origin', v)}
                />
                <div className="col-span-full">
                  <VaultInput
                    label="Ethnicity / Heritage"
                    value={profile.identify.ethnicity}
                    onChange={(v) => iSet('ethnicity', v)}
                  />
                </div>
              </VaultSection>
            )}

            {activeCategory === 'social' && (
              <VaultSection
                icon={<Briefcase />}
                title="Social Context"
                color="text-cyan-400"
                isStale={isStale(profile.personal.lastUpdated)}
              >
                <VaultSelect
                  label="Status"
                  value={profile.personal.status}
                  options={SUGGESTIONS.status}
                  onChange={(v) => pSet('status', v)}
                />
                <VaultInput
                  label="Job Title"
                  value={profile.personal.jobRole}
                  onChange={(v) => pSet('jobRole', v)}
                />
                <div className="col-span-full space-y-10">
                  <ChipInput
                    label="Core Identity Roles"
                    selected={ruleOfLife.valuesRoles.roles}
                    suggestions={SUGGESTIONS.roles}
                    onUpdate={setRoles}
                  />
                  <ChipInput
                    label="Neural Stimulants (Interests)"
                    selected={profile.personal.interests}
                    suggestions={SUGGESTIONS.interests}
                    onUpdate={(items) => pSet('interests', items)}
                  />
                </div>
              </VaultSection>
            )}

            {activeCategory === 'health' && (
              <VaultSection
                icon={<Activity />}
                title="Biological Matrix"
                color="text-emerald-400"
                isStale={isStale(profile.health.lastUpdated)}
              >
                <VaultInput
                  label="Height (cm)"
                  value={profile.health.height}
                  onChange={(v) => hSet('height', v)}
                />
                <VaultInput
                  label="Weight (kg)"
                  value={profile.health.weight}
                  onChange={(v) => hSet('weight', v)}
                />
                <ChipInput
                  label="Health Conditions"
                  selected={profile.health.conditions}
                  suggestions={SUGGESTIONS.conditions}
                  onUpdate={(items) => hSet('conditions', items)}
                />
                <ChipInput
                  label="Vitamins & Protocols"
                  selected={profile.health.medications}
                  suggestions={SUGGESTIONS.medications}
                  onUpdate={(items) => hSet('medications', items)}
                />
              </VaultSection>
            )}

            {activeCategory === 'finance' && (
              <VaultSection
                icon={<Landmark />}
                title="Resource Engine"
                color="text-amber-400"
                isStale={isStale(profile.finances.lastUpdated)}
              >
                <VaultInput
                  label="Monthly Yield (Income)"
                  value={profile.finances.income}
                  onChange={(v) => fSet('income', v)}
                />
                <VaultInput
                  label="Total Liabilities"
                  value={profile.finances.liabilities}
                  onChange={(v) => fSet('liabilities', v)}
                />
                <div className="col-span-full mt-4">
                  <VaultInput
                    label="Total Aggregated Assets"
                    value={profile.finances.assetsTotal}
                    onChange={(v) => fSet('assetsTotal', v)}
                  />
                </div>
              </VaultSection>
            )}

            {activeCategory === 'spiritual' && (
              <VaultSection
                icon={<Globe />}
                title="Ethical Root"
                color="text-indigo-400"
                isStale={isStale(profile.spiritual.lastUpdated)}
              >
                <VaultSelect
                  label="Belief System"
                  value={profile.spiritual.worldview}
                  options={SUGGESTIONS.worldview}
                  onChange={(v) => sSet('worldview', v)}
                />
                <div className="col-span-full">
                  <ChipInput
                    label="Core Values (The Axiology)"
                    selected={profile.spiritual.coreValues}
                    suggestions={SUGGESTIONS.values}
                    onUpdate={(v) => sSet('coreValues', v)}
                  />
                </div>
              </VaultSection>
            )}

            {activeCategory === 'relational' && (
              <VaultSection
                icon={<Users />}
                title="Relational Grid"
                color="text-cyan-400"
                isStale={isStale(profile.relationship.lastUpdated)}
              >
                <VaultSelect
                  label="Living Topology"
                  value={profile.relationship.livingArrangement}
                  options={SUGGESTIONS.livingArrangements}
                  onChange={(v) => rSet('livingArrangement', v)}
                />
                <ChipInput
                  label="Relational Commitments"
                  selected={profile.relationship.dailyCommitments}
                  suggestions={SUGGESTIONS.commitments}
                  onUpdate={(v) => rSet('dailyCommitments', v)}
                />
              </VaultSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GlanceCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({
  title,
  value,
  icon,
}) => (
  <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 hover:border-indigo-500/20 transition-all group shadow-xl">
    <div className="flex items-center gap-4 mb-4">
      <div className="p-3 bg-slate-950 rounded-2xl group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
        {title}
      </span>
    </div>
    <p className="text-3xl font-black text-white tracking-tighter italic">{value}</p>
  </div>
);
