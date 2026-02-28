export type GuidedVaultFieldId =
  | 'monthly_income'
  | 'monthly_fixed_expenses'
  | 'monthly_variable_expenses'
  | 'health_weight'
  | 'activity_frequency'
  | 'health_conditions'
  | 'social_energy'
  | 'core_values';

export interface GuidedVaultField {
  id: GuidedVaultFieldId;
  label: string;
  question: string;
  placeholder: string;
  section: 'finances' | 'health' | 'relationship' | 'spiritual';
  field: string;
  kind?: 'list';
}

export const GUIDED_VAULT_FIELDS: Record<GuidedVaultFieldId, GuidedVaultField> = {
  monthly_income: {
    id: 'monthly_income',
    label: 'Monthly income',
    question: 'What is your current monthly income?',
    placeholder: 'e.g. 8500 USD',
    section: 'finances',
    field: 'income',
  },
  monthly_fixed_expenses: {
    id: 'monthly_fixed_expenses',
    label: 'Fixed expenses',
    question: 'What are your monthly fixed expenses?',
    placeholder: 'e.g. 2400 rent + bills',
    section: 'finances',
    field: 'fixedCosts',
  },
  monthly_variable_expenses: {
    id: 'monthly_variable_expenses',
    label: 'Variable expenses',
    question: 'What do you usually spend monthly on flexible costs?',
    placeholder: 'e.g. 1200 food, travel, misc',
    section: 'finances',
    field: 'variableCosts',
  },
  health_weight: {
    id: 'health_weight',
    label: 'Weight',
    question: 'What is your current weight?',
    placeholder: 'e.g. 74 kg',
    section: 'health',
    field: 'weight',
  },
  activity_frequency: {
    id: 'activity_frequency',
    label: 'Activity frequency',
    question: 'How often do you train or exercise in a normal week?',
    placeholder: 'e.g. 4x a week',
    section: 'health',
    field: 'activityFrequency',
  },
  health_conditions: {
    id: 'health_conditions',
    label: 'Health conditions',
    question: 'Any recurring health conditions or symptoms Aura should know?',
    placeholder: 'Separate with commas',
    section: 'health',
    field: 'conditions',
    kind: 'list',
  },
  social_energy: {
    id: 'social_energy',
    label: 'Social energy',
    question: 'How would you describe your social energy?',
    placeholder: 'e.g. introvert with short bursts',
    section: 'relationship',
    field: 'socialEnergy',
  },
  core_values: {
    id: 'core_values',
    label: 'Core values',
    question: 'What core values should anchor your decisions?',
    placeholder: 'Separate with commas',
    section: 'spiritual',
    field: 'coreValues',
    kind: 'list',
  },
};

export const getGuidedVaultFields = (ids: string[]) =>
  ids
    .map((id) => GUIDED_VAULT_FIELDS[id as GuidedVaultFieldId])
    .filter(Boolean);

export const normalizeGuidedVaultValue = (field: GuidedVaultField, value: string) => {
  if (field.kind === 'list') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value.trim();
};
