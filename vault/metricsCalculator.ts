import { UserProfile, Category } from '@/data';

export interface HealthMetrics {
  bmi: number | null;
  bmiCategory: string;
  bmiColor: string;
  sleepHours: number | null;
  sleepStatus: string;
  sleepColor: string;
  activityLevel: string;
  activityScore: number;
}

export interface FinanceMetrics {
  netWorth: number | null;
  netWorthFormatted: string;
  savingsRate: number | null;
  savingsRateFormatted: string;
  savingsRateStatus: string;
  savingsRateColor: string;
  expenseRatio: number | null;
  expenseRatioFormatted: string;
  emergencyFundMonths: number | null;
  emergencyFundStatus: string;
  emergencyFundColor: string;
}

export interface RelationshipMetrics {
  timeTogether: string | null;
  socialEnergyLevel: string;
}

export interface SpiritualMetrics {
  practiceFrequency: string;
  valuesCount: number;
}

export interface BenchmarkComparison {
  label: string;
  userValue: string | number;
  benchmark: string;
  status: 'above' | 'below' | 'average' | 'neutral';
}

const US_BENCHMARKS = {
  netWorthByAge: {
    25: 40000,
    35: 135600,
    45: 212500,
    55: 364500,
    65: 409900,
  },
  savingsRate: 5.0,
  savingsRateTarget: 20.0,
  expenseRatioTarget: 50.0,
  emergencyFundMonths: 3,
  bmiNormal: { min: 18.5, max: 24.9 },
  sleepOptimal: { min: 7, max: 9 },
};

function parseWeight(weightStr: string): number | null {
  if (!weightStr) return null;
  const num = parseFloat(weightStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

function parseHeight(heightStr: string): number | null {
  if (!heightStr) return null;
  // Handle both "5'10" and "178cm" formats
  if (heightStr.includes("'")) {
    const parts = heightStr.replace(/'/g, '').replace(/"/g, '').split(/(\d+)/).filter(Boolean);
    if (parts.length >= 2) {
      const feet = parseInt(parts[0]);
      const inches = parseInt(parts[1]) || 0;
      return (feet * 12 + inches) * 0.0254;
    }
  }
  // Handle cm
  const num = parseFloat(heightStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num / 100;
}

function parseTime(timeStr: string): number | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours)) return null;
  return hours + (minutes || 0) / 60;
}

export function calculateHealthMetrics(profile: UserProfile): HealthMetrics {
  const weight = parseWeight(profile.health?.weight);
  const height = parseHeight(profile.health?.height);
  const sleepTime = parseTime(profile.health?.sleepTime);
  const wakeTime = parseTime(profile.health?.wakeTime);

  let bmi: number | null = null;
  let bmiCategory = 'No data';
  let bmiColor = 'text-slate-400';

  if (weight && height && height > 0) {
    bmi = weight / (height * height);
    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = 'text-amber-400';
    } else if (bmi < 25) {
      bmiCategory = 'Normal';
      bmiColor = 'text-emerald-400';
    } else if (bmi < 30) {
      bmiCategory = 'Overweight';
      bmiColor = 'text-amber-400';
    } else {
      bmiCategory = 'Obese';
      bmiColor = 'text-rose-400';
    }
  }

  let sleepHours: number | null = null;
  let sleepStatus = 'No data';
  let sleepColor = 'text-slate-400';

  if (sleepTime !== null && wakeTime !== null) {
    sleepHours = wakeTime - sleepTime;
    if (sleepHours < 0) sleepHours += 24;
    if (sleepHours >= 7 && sleepHours <= 9) {
      sleepStatus = 'Optimal';
      sleepColor = 'text-emerald-400';
    } else if (sleepHours >= 6 && sleepHours < 7) {
      sleepStatus = 'Adequate';
      sleepColor = 'text-blue-400';
    } else if (sleepHours < 6) {
      sleepStatus = 'Insufficient';
      sleepColor = 'text-amber-400';
    } else {
      sleepStatus = 'Excessive';
      sleepColor = 'text-amber-400';
    }
  }

  const activityFreq = profile.health?.activityFrequency?.toLowerCase() || '';
  let activityLevel = 'Sedentary';
  let activityScore = 0;

  if (activityFreq.includes('daily') || activityFreq.includes('high')) {
    activityLevel = 'Very Active';
    activityScore = 90;
  } else if (activityFreq.includes('moderate') || activityFreq.includes('3-4')) {
    activityLevel = 'Moderate';
    activityScore = 60;
  } else if (activityFreq.includes('light') || activityFreq.includes('1-2')) {
    activityLevel = 'Light';
    activityScore = 30;
  }

  return { bmi, bmiCategory, bmiColor, sleepHours, sleepStatus, sleepColor, activityLevel, activityScore };
}

export function calculateFinanceMetrics(profile: UserProfile): FinanceMetrics {
  const assets = parseFloat(profile.finances?.assetsTotal?.replace(/[^0-9.]/g, '') || '0');
  const liabilities = parseFloat(profile.finances?.liabilities?.replace(/[^0-9.]/g, '') || '0');
  const income = parseFloat(profile.finances?.income?.replace(/[^0-9.]/g, '') || '0');
  const fixedCosts = parseFloat(profile.finances?.fixedCosts?.replace(/[^0-9.]/g, '') || '0');
  const variableCosts = parseFloat(profile.finances?.variableCosts?.replace(/[^0-9.]/g, '') || '0');
  const cash = parseFloat(profile.finances?.assetsBreakdown?.cash?.replace(/[^0-9.]/g, '') || '0');

  let netWorth: number | null = null;
  let netWorthFormatted = 'No data';
  
  if (assets > 0) {
    netWorth = assets - liabilities;
    if (netWorth >= 1000000) {
      netWorthFormatted = `$${(netWorth / 1000000).toFixed(1)}M`;
    } else if (netWorth >= 1000) {
      netWorthFormatted = `$${(netWorth / 1000).toFixed(0)}K`;
    } else {
      netWorthFormatted = `$${netWorth.toFixed(0)}`;
    }
  }

  let savingsRate: number | null = null;
  let savingsRateFormatted = 'No data';
  let savingsRateStatus = '';
  let savingsRateColor = 'text-slate-400';

  if (income > 0) {
    const totalCosts = fixedCosts + variableCosts;
    savingsRate = ((income - totalCosts) / income) * 100;
    savingsRateFormatted = `${savingsRate.toFixed(1)}%`;
    
    if (savingsRate >= 20) {
      savingsRateStatus = 'Excellent';
      savingsRateColor = 'text-emerald-400';
    } else if (savingsRate >= 10) {
      savingsRateStatus = 'Good';
      savingsRateColor = 'text-blue-400';
    } else if (savingsRate >= 5) {
      savingsRateStatus = 'Below Average';
      savingsRateColor = 'text-amber-400';
    } else {
      savingsRateStatus = 'Needs Attention';
      savingsRateColor = 'text-rose-400';
    }
  }

  let expenseRatio: number | null = null;
  let expenseRatioFormatted = 'No data';

  if (income > 0) {
    expenseRatio = ((fixedCosts + variableCosts) / income) * 100;
    expenseRatioFormatted = `${expenseRatio.toFixed(0)}%`;
  }

  let emergencyFundMonths: number | null = null;
  let emergencyFundStatus = '';
  let emergencyFundColor = 'text-slate-400';

  const monthlyCosts = fixedCosts + variableCosts;
  if (cash > 0 && monthlyCosts > 0) {
    emergencyFundMonths = cash / monthlyCosts;
    if (emergencyFundMonths >= 6) {
      emergencyFundStatus = 'Fully Funded';
      emergencyFundColor = 'text-emerald-400';
    } else if (emergencyFundMonths >= 3) {
      emergencyFundStatus = 'Adequate';
      emergencyFundColor = 'text-blue-400';
    } else if (emergencyFundMonths >= 1) {
      emergencyFundStatus = 'Building';
      emergencyFundColor = 'text-amber-400';
    } else {
      emergencyFundStatus = 'Priority';
      emergencyFundColor = 'text-rose-400';
    }
  }

  return {
    netWorth,
    netWorthFormatted,
    savingsRate,
    savingsRateFormatted,
    savingsRateStatus,
    savingsRateColor,
    expenseRatio,
    expenseRatioFormatted,
    emergencyFundMonths,
    emergencyFundStatus,
    emergencyFundColor,
  };
}

export function calculateRelationshipMetrics(profile: UserProfile): RelationshipMetrics {
  let timeTogether: string | null = null;
  
  const status = profile.relationship?.relationshipStatus?.toLowerCase() || '';
  const livingArrangement = profile.relationship?.livingArrangement?.toLowerCase() || '';
  
  if (status.includes('married') || status.includes('formalized') || status.includes('long-term')) {
    timeTogether = 'Long-term';
  } else if (status.includes('dating') || status.includes('seeing')) {
    timeTogether = 'Dating';
  } else if (status.includes('single')) {
    timeTogether = 'Single';
  }

  const socialEnergy = profile.relationship?.socialEnergy?.toLowerCase() || '';
  let socialEnergyLevel = 'Balanced';
  
  if (socialEnergy.includes('high') || socialEnergy.includes('extrovert')) {
    socialEnergyLevel = 'High';
  } else if (socialEnergy.includes('low') || socialEnergy.includes('introvert')) {
    socialEnergyLevel = 'Low';
  }

  return { timeTogether, socialEnergyLevel };
}

export function calculateSpiritualMetrics(profile: UserProfile): SpiritualMetrics {
  const values = profile.spiritual?.coreValues || [];
  const practice = profile.spiritual?.practicePulse?.toLowerCase() || '';

  let practiceFrequency = 'Not Set';
  if (practice.includes('daily')) practiceFrequency = 'Daily';
  else if (practice.includes('weekly')) practiceFrequency = 'Weekly';
  else if (practice.includes('monthly')) practiceFrequency = 'Monthly';
  else if (practice.includes('rare')) practiceFrequency = 'Rarely';

  return {
    practiceFrequency,
    valuesCount: values.length,
  };
}

export function getBenchmarks(profile: UserProfile): BenchmarkComparison[] {
  const benchmarks: BenchmarkComparison[] = [];
  
  // Finance benchmarks
  const finance = calculateFinanceMetrics(profile);
  if (finance.savingsRate !== null) {
    benchmarks.push({
      label: 'Savings Rate',
      userValue: finance.savingsRateFormatted,
      benchmark: 'Target: 20%+',
      status: finance.savingsRate >= 20 ? 'above' : finance.savingsRate >= 10 ? 'average' : 'below',
    });
  }

  if (finance.emergencyFundMonths !== null) {
    benchmarks.push({
      label: 'Emergency Fund',
      userValue: `${finance.emergencyFundMonths?.toFixed(1) || 0} months`,
      benchmark: 'Target: 3+ months',
      status: finance.emergencyFundMonths >= 3 ? 'above' : 'below',
    });
  }

  // Health benchmarks
  const health = calculateHealthMetrics(profile);
  if (health.bmi !== null) {
    benchmarks.push({
      label: 'BMI',
      userValue: health.bmi.toFixed(1),
      benchmark: 'Normal: 18.5-24.9',
      status: health.bmi >= 18.5 && health.bmi <= 24.9 ? 'above' : 'below',
    });
  }

  if (health.sleepHours !== null) {
    benchmarks.push({
      label: 'Sleep',
      userValue: `${health.sleepHours?.toFixed(1) || 0} hours`,
      benchmark: 'Optimal: 7-9 hours',
      status: health.sleepHours >= 7 && health.sleepHours <= 9 ? 'above' : 'below',
    });
  }

  return benchmarks;
}