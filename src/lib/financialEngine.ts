import { FullProfile } from './types.ts';

export function calculateNetWorth(profile: FullProfile): number {
  const assetsValue = profile.assets.reduce((sum, a) => sum + a.value, 0);
  const portfolioValue = profile.holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
  const liquidCash = 0; // If they have a cash asset tracked
  
  const liabilities = profile.loans.reduce((sum, l) => sum + l.principalAmount, 0);

  return (assetsValue + portfolioValue + liquidCash) - liabilities;
}

export function calculateMonthlyIncome(profile: FullProfile): number {
  return profile.incomes.reduce((sum, inc) => {
    if (inc.frequency === 'MONTHLY') return sum + inc.amount;
    if (inc.frequency === 'YEARLY') return sum + (inc.amount / 12);
    return sum; // ignore one-time
  }, 0);
}

export function calculateMonthlyExpenses(profile: FullProfile): number {
  const regularExpenses = profile.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const emiExpenses = profile.loans.reduce((sum, loan) => sum + loan.monthlyEmi, 0);
  const subs = profile.subscriptions.reduce((sum, sub) => {
    if (sub.cycle === 'MONTHLY') return sum + sub.amount;
    if (sub.cycle === 'YEARLY') return sum + (sub.amount / 12);
    return sum;
  }, 0);
  
  return regularExpenses + emiExpenses + subs;
}

export function calculateMonthlyCashFlow(profile: FullProfile): number {
  return calculateMonthlyIncome(profile) - calculateMonthlyExpenses(profile);
}

export function calculateSavingsRate(profile: FullProfile): number {
  const income = calculateMonthlyIncome(profile);
  if (income <= 0) return 0;
  const savings = calculateMonthlyCashFlow(profile);
  return Math.max(0, savings / income);
}

export function calculateDebtToIncomeRatio(profile: FullProfile): number {
  const income = calculateMonthlyIncome(profile);
  if (income <= 0) return profile.loans.length > 0 ? 1 : 0;
  const emiExpenses = profile.loans.reduce((sum, loan) => sum + loan.monthlyEmi, 0);
  return emiExpenses / income;
}

export function calculateFHS(profile: FullProfile): number {
  let score = 50;

  const savingsRate = calculateSavingsRate(profile);
  const dti = calculateDebtToIncomeRatio(profile);
  
  // Savings Rate (20% weight) -> ideal is > 20%
  if (savingsRate >= 0.2) score += 20;
  else if (savingsRate >= 0.1) score += 10;
  else score -= 10;

  // Debt Management (20% weight) -> ideal is < 30%
  if (dti <= 0.3) score += 20;
  else if (dti <= 0.4) score += 10;
  else if (dti > 0.5) score -= 20;

  // Emergency Fund (15%) -> Let's assume cash is an asset named "Emergency Fund" or "Savings"
  const cashAssets = profile.assets.filter(a => a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('emergency') || a.name.toLowerCase().includes('savings'));
  const cashTotal = cashAssets.reduce((sum, a) => sum + a.value, 0);
  const monthlyExp = calculateMonthlyExpenses(profile);
  
  if (monthlyExp > 0) {
    const monthsCovered = cashTotal / monthlyExp;
    if (monthsCovered >= 6) score += 15;
    else if (monthsCovered >= 3) score += 7;
    else score -= 5;
  }

  // Investment Diversification (15%)
  if (profile.holdings.length > 3) score += 15;
  else if (profile.holdings.length > 0) score += 7;

  // Goal Progress (15%)
  if (profile.goals.length > 0) {
    const avgProgress = profile.goals.reduce((sum, g) => sum + (g.currentSavings / (g.targetAmount || 1)), 0) / profile.goals.length;
    if (avgProgress > 0.5) score += 15;
    else if (avgProgress > 0.1) score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateMetrics(profile: FullProfile) {
  return {
    netWorth: calculateNetWorth(profile),
    monthlyCashFlow: calculateMonthlyCashFlow(profile),
    savingsRate: calculateSavingsRate(profile),
    debtToIncomeRatio: calculateDebtToIncomeRatio(profile),
    financialHealthScore: calculateFHS(profile)
  };
}
