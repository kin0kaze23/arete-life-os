import { FinanceMetrics, MemoryEntry, UserProfile } from './types';
import { parseNumber } from '../shared/utils';

const isNumber = (val: unknown): val is number => typeof val === 'number' && Number.isFinite(val);

export const computeFinanceMetrics = (profile: UserProfile): FinanceMetrics | null => {
  const income = profile.finances.income ? parseNumber(profile.finances.income) : null;
  const fixed = profile.finances.fixedCosts ? parseNumber(profile.finances.fixedCosts) : null;
  const variable = profile.finances.variableCosts
    ? parseNumber(profile.finances.variableCosts)
    : null;
  if (income === null || fixed === null || variable === null) return null;
  return {
    income,
    fixed,
    variable,
    dailyVariableBudget: Math.round(variable / 30),
    weeklyVariableBudget: Math.round(variable / 4),
    savingsRate: Math.round(Math.max(0, (income - (fixed + variable)) / income) * 100),
  };
};

export const extractFinanceMetricsFromMemory = (memory: MemoryEntry[]): FinanceMetrics | null => {
  const latest = memory
    .filter((item) => item.metadata?.type === 'finance_metrics')
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  const payload = latest?.metadata?.payload;
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;
  const { income, fixed, variable, dailyVariableBudget, weeklyVariableBudget, savingsRate } = data;
  if (
    !isNumber(income) ||
    !isNumber(fixed) ||
    !isNumber(variable) ||
    !isNumber(dailyVariableBudget) ||
    !isNumber(weeklyVariableBudget) ||
    !isNumber(savingsRate)
  ) {
    return null;
  }
  return {
    income,
    fixed,
    variable,
    dailyVariableBudget,
    weeklyVariableBudget,
    savingsRate,
  };
};
