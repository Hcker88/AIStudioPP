import { FullProfile, Insight } from './types.ts';
import { calculateSavingsRate, calculateDebtToIncomeRatio, calculateNetWorth, calculateFHS, calculateMonthlyCashFlow } from './financialEngine.ts';

export function generateInsights(profile: FullProfile): Insight[] {
  const insights: Insight[] = [];
  
  const savingsRate = calculateSavingsRate(profile);
  const dti = calculateDebtToIncomeRatio(profile);
  const netWorth = calculateNetWorth(profile);
  const fhs = calculateFHS(profile);
  const cashFlow = calculateMonthlyCashFlow(profile);

  if (savingsRate < 0.2 && savingsRate >= 0) {
    insights.push({
      userId: profile.user.userId,
      content: `Your savings rate is ${(savingsRate * 100).toFixed(1)}%, which is below the recommended 20%. Try to reduce discretionary expenses incrementally.`,
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (dti > 0.4) {
    insights.push({
      userId: profile.user.userId,
      content: `Your debt-to-income ratio is ${(dti * 100).toFixed(1)}%, which is above the healthy threshold of 30-40%. Avoid taking on new debt.`,
      priority: 'CRITICAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (netWorth < 0) {
    insights.push({
      userId: profile.user.userId,
      content: "Your liabilities exceed your assets right now. Focus on an aggressive debt payoff strategy.",
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (cashFlow < 0) {
    insights.push({
      userId: profile.user.userId,
      content: `You have a negative monthly cash flow of ₹${Math.abs(cashFlow)}. You are losing money every month! Cut non-essential spending immediately.`,
      priority: 'CRITICAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Portfolio 
  if (profile.assets.some(a => a.name.toLowerCase().includes('gold')) && profile.holdings.length === 0) {
    insights.push({
      userId: profile.user.userId,
      content: "Your portfolio relies on physical/traditional assets (gold) but lacks growth-focused equities. Consider starting an index fund SIP.",
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  insights.push({
    userId: profile.user.userId,
    content: `Your overall Financial Health Score is ${fhs}/100.`,
    priority: 'INFO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return insights;
}
