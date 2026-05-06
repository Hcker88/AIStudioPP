import { FullProfile, Insight } from './types.ts';
import { calculateSavingsRate, calculateDebtToIncomeRatio, calculateNetWorth, calculateFHS, calculateMonthlyCashFlow } from './financialEngine.ts';

export function generateInsights(profile: FullProfile): Insight[] {
  const insights: Insight[] = [];
  
  const savingsRate = calculateSavingsRate(profile);
  const dti = calculateDebtToIncomeRatio(profile);
  const netWorth = calculateNetWorth(profile);
  const fhs = calculateFHS(profile);
  const cashFlow = calculateMonthlyCashFlow(profile);

  if (savingsRate < 0.2) {
    insights.push({
      userId: profile.user.userId,
      content: `At your current spending pattern, your savings rate is below optimal levels. This will slow down wealth growth.`,
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (dti > 0.5) {
    insights.push({
      userId: profile.user.userId,
      content: `Your debt load is high relative to your income. Reducing this will significantly improve financial stability.`,
      priority: 'CRITICAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (netWorth < 0) {
    insights.push({
      userId: profile.user.userId,
      content: `Your liabilities currently exceed your assets. Priority should be stabilizing this gap.`,
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Portfolio 
  if (profile.assets.some(a => a.name.toLowerCase().includes('gold')) && profile.holdings.length === 0) {
    insights.push({
      userId: profile.user.userId,
      content: `Your portfolio is heavily tilted toward low-growth assets. Consider adding growth-oriented investments.`,
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  insights.push({
    userId: profile.user.userId,
    content: `Financial Health Score: ${fhs}/100`,
    priority: 'INFO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return insights;
}
