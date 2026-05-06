import { UserProfileSchema } from "./types";

export function calculateNetWorth(profile: UserProfileSchema): number {
  const totalAssets = getStockValue(profile) + (profile.assets.gold || 0);
  const totalLiabilities = profile.loans.reduce((acc, curr) => acc + curr, 0);
  return totalAssets - totalLiabilities;
}

export function calculateSavingsRate(profile: UserProfileSchema): number {
  if (!profile.income || profile.income === 0) return 0;
  return (profile.income - profile.expenses) / profile.income;
}

export function calculateDebtRatio(profile: UserProfileSchema): number {
  if (!profile.income || profile.income === 0) return 0;
  
  const totalDebt = profile.loans.reduce((acc, curr) => acc + curr, 0);
  const estimatedMonthlyEMI = totalDebt * 0.02; 
  return estimatedMonthlyEMI / profile.income;
}

export function getStockValue(profile: UserProfileSchema): number {
  return profile.assets.stocks.reduce((acc, stock) => {
    return acc + (stock.quantity * (stock.currentPrice || stock.buyPrice));
  }, 0);
}

export function calculateFHS(profile: UserProfileSchema): number {
  let score = 50; // Start at baseline
  
  const savingsRate = calculateSavingsRate(profile);
  const debtRatio = calculateDebtRatio(profile);
  const netWorth = calculateNetWorth(profile);
  
  // Score updates based on savings rate
  if (savingsRate > 0.3) score += 20;
  else if (savingsRate > 0.15) score += 10;
  else if (savingsRate <= 0.0) score -= 15;
  
  // Score updates based on debt ratio
  if (debtRatio === 0) score += 10;
  else if (debtRatio > 0.4) score -= 15;
  else if (debtRatio > 0.6) score -= 25;
  
  // Score updates based on net worth
  if (netWorth > profile.income * 6) score += 15; // NW > 6 months income
  else if (netWorth < 0) score -= 15;
  
  // Assets diversification
  if (profile.assets.stocks.length > 0) score += 5;
  if (profile.assets.gold > 0) score += 5;
  
  return Math.min(Math.max(Math.round(score), 0), 100);
}
