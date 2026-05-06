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
      `Your savings rate of ${(savingsRate * 100).toFixed(1)}% is critically below the 20% safe margin.`
    );
  } else if (savingsRate >= 0.3) {
    insights.push(`Your savings rate of ${(savingsRate * 100).toFixed(1)}% is strong. Consider channeling the surplus into investments.`);
  }

  // DEBT INSIGHT
  if (debtRatio > 0.4) {
    insights.push(
      `Warning: ${(debtRatio * 100).toFixed(0)}% of your income is consumed by debt, far above the 30% safety limit.`
    );
  } else if (profile.loans.length > 0 && debtRatio <= 0.3) {
    insights.push(`Your debt ratio is a manageable ${(debtRatio * 100).toFixed(0)}%.`);
  }

  // NET WORTH AND PORTFOLIO
  if (netWorth < 0) {
    insights.push(
      `Your net worth is negative (₹${Math.abs(netWorth).toLocaleString("en-IN")}). Your primary goal is eliminating high-interest liabilities.`
    );
  }

  // TREND ENGINE
  if (profile.history && profile.history.length > 0) {
    const latestHistory = profile.history[profile.history.length - 1];
    if (latestHistory && latestHistory.snapshot) {
      const prev = latestHistory.snapshot;
      
      const prevValEx = prev.expenses || 0;
      if (profile.expenses > prevValEx && prevValEx > 0) {
        const delta = ((profile.expenses - prevValEx) / prevValEx) * 100;
        if (delta > 5) {
          insights.push(`Your expenses increased by ${delta.toFixed(1)}% compared to your previous snapshot.`);
        }
      } else if (profile.expenses < prevValEx && profile.expenses > 0) {
        const delta = ((prevValEx - profile.expenses) / prevValEx) * 100;
        if (delta > 5) {
          insights.push(`Your expenses improved (decreased by ${delta.toFixed(1)}%).`);
        }
      }

      // Net Worth Calculation Check
      try {
        const prevTotalAssets = (prev.assets?.stocks?.reduce((acc: number, s: any) => acc + (s.quantity * (s.currentPrice || s.buyPrice)), 0) || 0) + (prev.assets?.gold || 0);
        const prevLiabilities = prev.loans?.reduce((acc: number, l: any) => acc + l, 0) || 0;
        const prevNetWorth = prevTotalAssets - prevLiabilities;
        
        if (netWorth > prevNetWorth && prevNetWorth !== 0) {
          insights.push(`Your net worth increased by ₹${(netWorth - prevNetWorth).toLocaleString("en-IN")}.`);
        } else if (netWorth < prevNetWorth) {
          insights.push(`Your net worth decreased by ₹${(prevNetWorth - netWorth).toLocaleString("en-IN")}.`);
        }
      } catch(e) {
        // fail silently for history net worth
      }
    }
  }

  return insights;
}
