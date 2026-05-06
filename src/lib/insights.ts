import { UserProfileSchema } from "./types";
import { calculateSavingsRate, calculateDebtRatio, calculateNetWorth, calculateFHS } from "./finance";

export function generateInsights(profile: UserProfileSchema): string[] {
  const insights: string[] = [];

  const savingsRate = calculateSavingsRate(profile);
  const debtRatio = calculateDebtRatio(profile);
  const netWorth = calculateNetWorth(profile);
  const fhs = calculateFHS(profile);

  // SAVINGS INSIGHT
  if (savingsRate < 0.2 && profile.income > 0) {
    insights.push(
      `At your current savings rate of ${(savingsRate * 100).toFixed(1)}%, your long-term financial growth will be significantly limited.`
    );
  } else if (savingsRate >= 0.3) {
    insights.push(`Your savings rate is strong. Capitalize on this surplus by funneling it into high-growth assets.`);
  }

  // DEBT INSIGHT
  if (debtRatio > 0.5) {
    insights.push(
      `Your debt load is structurally high relative to your income. Reducing this will significantly improve your baseline stability.`
    );
  } else if (profile.loans.length > 0 && debtRatio <= 0.3) {
    insights.push(`Your debt is manageable, but aggressively paying down the highest interest principal will yield guaranteed ROI.`);
  }

  // NET WORTH AND PORTFOLIO
  if (netWorth < 0) {
    insights.push(
      `Your liabilities currently exceed your assets. Priority should be scaling down debt to stabilize this gap.`
    );
  } else if (profile.assets.gold > 0 && profile.assets.stocks.length === 0) {
    insights.push(
      `Your portfolio is heavily tilted toward low-growth, legacy assets. Adding market-oriented elements is required for long-term compound growth.`
    );
  } else if (profile.assets.stocks.length > 0 && profile.assets.gold === 0) {
    insights.push(`Your assets are concentrated in equities. Consider minimal hedging with defensive assets as wealth grows.`);
  }

  // HISTORICAL COMPARISON
  if (profile.history && profile.history.length > 1) {
    const previousSnapshot = profile.history[profile.history.length - 2].snapshot;
    // Calculate previous net worth if possible
    try {
      const prevTotalAssets = (previousSnapshot.assets?.stocks?.reduce((acc: number, s: any) => acc + (s.quantity * (s.currentPrice || s.buyPrice)), 0) || 0) + (previousSnapshot.assets?.gold || 0);
      const prevLiabilities = previousSnapshot.loans?.reduce((acc: number, l: any) => acc + l, 0) || 0;
      const prevNetWorth = prevTotalAssets - prevLiabilities;
      
      if (netWorth > prevNetWorth) {
        insights.push(`Positive trajectory: Your net worth improved by ₹${(netWorth - prevNetWorth).toLocaleString("en-IN")} since the last snapshot.`);
      }
    } catch(e) {
      // safe fail
    }
  }

  // FINAL SCORE
  insights.push(`Financial Health Score: ${fhs}/100`);

  return insights;
}
