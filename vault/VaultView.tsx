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
} from '../shared/SharedUI';
import { UserProfile, RelationshipContact, RuleOfLife, Category } from '../data/types';

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  if (!activeCategory) {
    return (
      <div className="space-y-12 pb-40 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlanceCard
            title="Profile Resonance"
            value={`${completion.overall}%`}
            icon={<Brain className="text-indigo-400" />}
          />
          <GlanceCard
            title="Active Roles"
            value={ruleOfLife.valuesRoles.roles.length}
            icon={<Star className="text-amber-400" />}
          />
          <GlanceCard
            title="Context Points"
            value={sections.filter((s) => !isStale(s.lastUpdated)).length}
            icon={<Zap className="text-emerald-400" />}
          />
          <GlanceCard
            title="Kernel Refresh"
            value="Stable"
            icon={<Activity className="text-rose-400" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((s) => {
            const stale = isStale(s.lastUpdated);
            return (
              <button
                key={s.id}
                onClick={() => setActiveCategory(s.id)}
                className={`glass-panel p-10 rounded-[3.5rem] border transition-all duration-500 group text-left ${stale ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-white/5 hover:border-indigo-500/30'}`}
              >
                <div className="flex justify-between items-start mb-8">
                  <div
                    className={`p-5 rounded-2xl bg-slate-950 ${s.color} group-hover:scale-110 transition-transform shadow-2xl`}
                  >
                    {React.cloneElement(s.icon as React.ReactElement<any>, { size: 28 })}
                  </div>
                  {stale && <AlertCircle className="text-amber-500 animate-pulse" size={24} />}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                    {s.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
                    {stale ? 'Signal calibration expired' : 'Signal locked and stable'}
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 group-hover:translate-x-2 transition-transform">
                  Calibrate Signal <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-40 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => setActiveCategory(null)}
        className="flex items-center gap-3 px-8 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all shadow-xl"
      >
        <LayoutGrid size={16} /> Return to Hub
      </button>

      {activeCategory === 'season' && (
        <VaultSection icon={<Compass />} title="Life Season" color="text-rose-400">
          <VaultInput
            label="Current Season"
            value={ruleOfLife.season.name}
            onChange={(v) => setSeason('name', v)}
          />
          <VaultSlider
            label="Intensity Level"
            value={ruleOfLife.season.intensity}
            min={1}
            max={10}
            onChange={(v) => setSeason('intensity', parseInt(v))}
          />
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

      <div className="sticky bottom-20 p-6 bg-[#08090C]/90 backdrop-blur-3xl border-t border-white/5 flex justify-center -mx-10 z-50">
        <button
          onClick={() => {
            onSync();
            setActiveCategory(null);
          }}
          className="w-full max-w-xl bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Zap size={18} fill="currentColor" className="animate-pulse" /> Finalize Calibration
        </button>
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
