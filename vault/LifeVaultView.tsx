import React, { useState } from 'react';
import { UserProfile, Claim, MemoryItem, Source, RuleOfLife } from '@/data/types';
import { NeuralDataGrid, GridItem } from './NeuralDataGrid';
import { VaultShell } from './VaultShell';
import { DossierView, FormField } from './DossierView';
import { InitWizard } from './InitWizard';
import { VaultOverview } from './VaultOverview';

interface LifeVaultViewProps {
  profile: UserProfile;
  ruleOfLife: RuleOfLife;
  claims: Claim[];
  memoryItems: MemoryItem[];
  sources: Source[];
  updateProfile: (section: string, field: string, value: any) => void;
  updateRuleOfLife: (rule: RuleOfLife) => void;
  onApprove: (claimIds: string[]) => void;
  onReject: (claimIds: string[]) => void;
  onResolve: (claimId: string, value: string) => void;
  onDeleteClaim: (claimId: string) => void;
  onDeleteMemory: (memoryId: string) => void;
  onUpdate: (claimId: string, value: string) => void;
  onSync: () => void;
  onToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  onAdd: (input: string) => Promise<void>;
}

export const LifeVaultView: React.FC<LifeVaultViewProps> = (props) => {
  const [path, setPath] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  React.useEffect(() => {
    if (!props.profile.identify?.name) {
      setShowWizard(true);
    }
  }, [props.profile.identify?.name]);

  const handleSettings = () => props.onToast('System Settings: Access Restricted [DEMO]', 'info');
  const handleNotifications = () => props.onToast('Notifications: No New Alerts', 'info');
  const handleQuickAdd = async () => {
    const input = prompt('Quick Entry (Memory/Fact):');
    if (input) {
      await props.onAdd(input);
      props.onToast('Entry encrypted and stored.', 'success');
    }
  };

  const renderContent = () => {
    const matchesSearch = (text: string) => text.toLowerCase().includes(searchQuery.toLowerCase());

    switch (path) {
      case '/':
        return (
          <VaultOverview
            profile={props.profile}
            memoryCount={props.memoryItems.length}
            claimCount={props.claims.length}
            storageUsage={2.4}
          />
        );

      case '/stream/logs': {
        const memoryGridItems: GridItem[] = props.memoryItems
          .filter((m) => matchesSearch(m.content) || matchesSearch(m.category))
          .map((m) => ({
            id: m.id,
            timestamp: m.timestamp,
            category: m.category,
            content: m.content,
            type: 'MEMORY',
          }));
        return (
          <div className="p-6 h-full">
            <NeuralDataGrid
              items={memoryGridItems}
              onDelete={(ids) => ids.forEach((id) => props.onDeleteMemory(id))}
              onEdit={(id, val) => props.onUpdate(id, val)}
              onAdd={handleQuickAdd}
            />
          </div>
        );
      }

      case '/stream/knowledge': {
        const claimGridItems: GridItem[] = props.claims
          .filter((c) => matchesSearch(c.fact) || matchesSearch(c.category))
          .map((c) => ({
            id: c.id,
            timestamp: c.timestamp,
            category: c.category,
            content: c.fact,
            type: 'CLAIM',
            confidence: c.confidence,
          }));
        return (
          <div className="p-6 h-full">
            <NeuralDataGrid
              items={claimGridItems}
              onDelete={(ids) => ids.forEach((id) => props.onDeleteClaim(id))}
              onEdit={(id, val) => props.onUpdate(id, val)}
              onVerify={(ids) => props.onApprove(ids)}
              onAdd={handleQuickAdd}
            />
          </div>
        );
      }

      case '/identity/core':
        return (
          <div className="p-6 max-w-2xl mx-auto">
            <div className="mt-8">
              <DossierView
                title="Core Identity"
                section="identify"
                profile={props.profile}
                updateProfile={props.updateProfile}
                schema={[
                  {
                    key: 'name',
                    label: 'Full Name',
                    type: 'text',
                    tooltip: 'Legal or preferred name.',
                  },
                  {
                    key: 'birthday',
                    label: 'Date of Birth',
                    type: 'text',
                    placeholder: 'YYYY-MM-DD',
                    tooltip: 'Used for age-related analysis.',
                  },
                  {
                    key: 'origin',
                    label: 'Hometown',
                    type: 'text',
                    tooltip: 'Place of origin or childhood.',
                  },
                  {
                    key: 'location',
                    label: 'Current Location',
                    type: 'text',
                    tooltip: 'Primary residence.',
                  },
                  {
                    key: 'ethnicity',
                    label: 'Ethnicity / Roots',
                    type: 'text',
                    tooltip: 'Cultural background.',
                  },
                  {
                    key: 'languages',
                    label: 'Languages Spoken',
                    type: 'languages',
                    tooltip: 'Languages you speak fluently.',
                  },
                ]}
              />
            </div>
          </div>
        );

      case '/identity/personal': {
        const personalSchema: FormField[] = [
          {
            key: 'jobRole',
            label: 'Job Role',
            type: 'text',
            placeholder: 'e.g. Chief Product Officer',
            tooltip: 'Your primary professional identity.',
          },
          {
            key: 'company',
            label: 'Company / Project',
            type: 'text',
            placeholder: 'e.g. Stealth Startup',
            tooltip: 'Current organization or focus.',
          },
          {
            key: 'personalityType',
            label: 'Personality Type',
            type: 'select',
            tooltip: 'Your psychological framework (MBTI/Enneagram).',
            options: [
              'INTJ - Architect',
              'INTP - Logician',
              'ENTJ - Commander',
              'ENTP - Debater',
              'INFJ - Advocate',
              'INFP - Mediator',
              'ENFJ - Protagonist',
              'ENFP - Campaigner',
              'ISTJ - Logistician',
              'ISFJ - Defender',
              'ESTJ - Executive',
              'ESFJ - Consul',
              'ISTP - Virtuoso',
              'ISFP - Adventurer',
              'ESTP - Entrepreneur',
              'ESFP - Entertainer',
              'Type 1 - Reformer',
              'Type 3 - Achiever',
              'Type 8 - Challenger',
            ],
          },
          {
            key: 'archetype',
            label: 'Core Archetype',
            type: 'select',
            tooltip: 'The mythic narrative pattern of your life.',
            options: [
              'The Creator',
              'The Ruler',
              'The Sage',
              'The Explorer',
              'The Hero',
              'The Magician',
              'The Outlaw',
              'The Lover',
              'The Jester',
              'The Everyman',
              'The Caregiver',
              'The Innocent',
            ],
          },
          {
            key: 'communicationStyle',
            label: 'Communication Preference',
            type: 'select',
            tooltip: 'How you prefer to exchange information.',
            options: [
              'Direct & Concise',
              'Socratic & Questioning',
              'Empathetic & Warm',
              'Data-Driven & Analytical',
              'Storyteller',
            ],
          },
          {
            key: 'interests',
            label: 'Interests & Hobbies',
            type: 'list',
            tooltip: 'Topics that energize you.',
            suggestions: [
              'Reading',
              'Hiking',
              'Coding',
              'Gaming',
              'Cooking',
              'Travel',
              'Photography',
              'Music',
              'Meditation',
              'Investing',
              'Fitness',
              'Art',
              'Philosophy',
              'Design',
              'Psychology',
            ],
          },
        ];
        return (
          <DossierView
            title="Personal Profile"
            section="personal"
            profile={props.profile}
            updateProfile={props.updateProfile}
            schema={personalSchema}
          />
        );
      }

      case '/identity/bio': {
        const bioSchema: FormField[] = [
          {
            key: 'height',
            label: 'Height',
            type: 'text',
            placeholder: 'e.g. 180cm / 5\'11"',
            tooltip: 'For BMI calculation.',
          },
          {
            key: 'weight',
            label: 'Weight',
            type: 'text',
            placeholder: 'e.g. 75kg / 165lbs',
            tooltip: 'Body mass tracking.',
          },
          {
            key: 'bloodPressure',
            label: 'Blood Pressure',
            type: 'text',
            placeholder: 'e.g. 120/80',
            tooltip: 'Last known BP.',
          },
          {
            key: 'restingHeartRate',
            label: 'Resting Heart Rate',
            type: 'text',
            placeholder: 'e.g. 60 bpm',
            tooltip: 'Cardiovascular efficiency.',
          },
          {
            key: 'bloodType',
            label: 'Blood Type',
            type: 'select',
            tooltip: 'Medical profile.',
            options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
          },
          {
            key: 'chronotype',
            label: 'Chronotype',
            type: 'select',
            tooltip: 'Sleep-wake cycle preference.',
            options: ['Early Bird (Lark)', 'Night Owl', 'Variable'],
          },
          {
            key: 'sleepTime',
            label: 'Typical Sleep Time',
            type: 'text',
            placeholder: '23:00',
            tooltip: 'Bedtime target.',
          },
          {
            key: 'wakeTime',
            label: 'Typical Wake Time',
            type: 'text',
            placeholder: '07:00',
            tooltip: 'Wake-up target.',
          },
          {
            key: 'activities',
            label: 'Physical Activities',
            type: 'list',
            tooltip: 'Regular exercise.',
            suggestions: [
              'Gym',
              'Running',
              'Yoga',
              'Swimming',
              'Cycling',
              'Hiking',
              'Pilates',
              'Crossfit',
            ],
          },
          {
            key: 'allergies',
            label: 'Allergies',
            type: 'list',
            tooltip: 'Substances to avoid.',
            suggestions: [
              'Peanuts',
              'Dairy',
              'Gluten',
              'Pollen',
              'Dust',
              'Shellfish',
              'Soy',
              'Eggs',
            ],
          },
          {
            key: 'medications',
            label: 'Medications',
            type: 'list',
            tooltip: 'Prescriptions & Supplements.',
            suggestions: ['Vitamin D', 'Omega-3', 'Magnesium', 'Multivitamin'],
          },
          {
            key: 'conditions',
            label: 'Medical Conditions',
            type: 'list',
            tooltip: 'Chronic issues to monitor.',
          },
        ];
        return (
          <DossierView
            title="Health & Biology"
            section="health"
            profile={props.profile}
            updateProfile={props.updateProfile}
            schema={bioSchema}
          />
        );
      }

      case '/identity/finance': {
        const financeSchema: FormField[] = [
          {
            key: 'income',
            label: 'Monthly Income',
            type: 'currency',
            placeholder: '$0.00',
            tooltip: 'Net monthly earnings.',
          },
          {
            key: 'fixedCosts',
            label: 'Fixed Costs',
            type: 'currency',
            placeholder: '$0.00',
            tooltip: 'Rent, bills, subscriptions.',
          },
          {
            key: 'variableCosts',
            label: 'Variable Costs',
            type: 'currency',
            placeholder: '$0.00',
            tooltip: 'Food, fun, discretionary.',
          },
          {
            key: 'savingsGoal',
            label: 'Savings Goal',
            type: 'text',
            tooltip: 'Primary financial target.',
          },
          {
            key: 'investmentStrategy',
            label: 'Investment Strategy',
            type: 'select',
            tooltip: 'Risk tolerance and approach.',
            options: ['Conservative', 'Balanced', 'Growth', 'Aggressive', 'Passive / Indexing'],
          },
          {
            key: 'assetsTotal',
            label: 'Total Assets',
            type: 'text',
            placeholder: '$0.00',
            tooltip: 'Net worth sum.',
          },
          {
            key: 'liabilities',
            label: 'Total Liabilities',
            type: 'text',
            placeholder: '$0.00',
            tooltip: 'Outstanding debt.',
          },
        ];
        return (
          <DossierView
            title="Financial Assets"
            section="finances"
            profile={props.profile}
            updateProfile={props.updateProfile}
            schema={financeSchema}
          />
        );
      }

      case '/identity/social': {
        const socialSchema: FormField[] = [
          {
            key: 'relationshipStatus',
            label: 'Relationship Status',
            type: 'select',
            tooltip: 'Current partner status.',
            options: [
              'Single',
              'In a Relationship',
              'Married',
              'Divorced',
              'Widowed',
              "It's Complicated",
            ],
          },
          {
            key: 'loveLanguage',
            label: 'Primary Love Language',
            type: 'select',
            tooltip: 'Preferred way to receive affection.',
            options: [
              'Words of Affirmation',
              'Acts of Service',
              'Receiving Gifts',
              'Quality Time',
              'Physical Touch',
            ],
          },
          {
            key: 'attachmentStyle',
            label: 'Attachment Style',
            type: 'select',
            tooltip: 'Relational bonding pattern.',
            options: ['Secure', 'Anxious-Preoccupied', 'Dismissive-Avoidant', 'Fearful-Avoidant'],
          },
          {
            key: 'livingArrangement',
            label: 'Living Arrangement',
            type: 'select',
            tooltip: 'Household composition.',
            options: ['Alone', 'With Partner', 'With Family', 'Roommates'],
          },
          {
            key: 'familyDynamic',
            label: 'Family Dynamic',
            type: 'select',
            tooltip: 'Quality of family relations.',
            options: [
              'Tight-knit',
              'Warm but Distant',
              'Formal',
              'Complicated/Strained',
              'Estranged',
            ],
          },
          {
            key: 'friendshipStyle',
            label: 'Friendship Maintenance',
            type: 'select',
            tooltip: 'Social interaction frequency.',
            options: ['Low Maintenance (Months)', 'High Frequency (Weekly)', 'Activity Based'],
          },
          {
            key: 'socialEnergy',
            label: 'Social Battery',
            type: 'select',
            tooltip: 'Introversion vs Extroversion spectrum.',
            options: ['Introvert (Recharge Alone)', 'Ambivert', 'Extrovert (Recharge with People)'],
          },
        ];
        return (
          <DossierView
            title="Relationships"
            section="relationship"
            profile={props.profile}
            updateProfile={props.updateProfile}
            schema={socialSchema}
          />
        );
      }

      case '/identity/spiritual': {
        const spiritSchema: FormField[] = [
          {
            key: 'worldview',
            label: 'Worldview',
            type: 'text',
            tooltip: 'Belief system or philosophy.',
          },
          {
            key: 'coreValues',
            label: 'Core Values',
            type: 'list',
            tooltip: 'Guiding principles.',
            suggestions: ['Freedom', 'Integrity', 'Growth', 'Family', 'Kindness', 'Truth'],
          },
          {
            key: 'practicePulse',
            label: 'Practice Frequency',
            type: 'select',
            tooltip: 'Consistency of spiritual practice.',
            options: ['Daily', 'Weekly', 'Occasional', 'None'],
          },
        ];
        return (
          <DossierView
            title="Beliefs & Values"
            section="spiritual"
            profile={props.profile}
            updateProfile={props.updateProfile}
            schema={spiritSchema}
          />
        );
      }
      default:
        return (
          <div className="p-10 text-slate-500 font-mono text-center">
            FILE NOT FOUND Or ACCESS DENIED
          </div>
        );
    }
  };

  return (
    <>
      {showWizard && (
        <InitWizard
          username={props.profile.identify?.name}
          onComplete={() => setShowWizard(false)}
        />
      )}
      <VaultShell
        activePath={path}
        onNavigate={setPath}
        profile={props.profile}
        onSearch={setSearchQuery}
        onSettings={handleSettings}
        onNotification={handleNotifications}
      >
        {renderContent()}
      </VaultShell>
    </>
  );
};
