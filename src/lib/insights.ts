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

  // HISTORICAL COMPARISON / TREND ENGINE
  if (profile.history && profile.history.length >= 1) { // >= 1 because the current save hasn't happened yet technically, wait, the parser creates a clone, history holds LAST state on DB. So history length > 0 is enough if we consider history as PAST. In memory DB, 'profile' already has the state we appended to?
    // Let's look at the latest snapshot before this current one. If current has not been added to history yet by the context (or if it has, we take previous).
    // Actually, in `profileDb`, history is appended on save. So the input `profile` has the history *prior* to this chat message save (if parser didn't append). Ensure we use the latest history index.
    const latestHistory = profile.history[profile.history.length - 1];
    if (latestHistory && latestHistory.snapshot) {
      const prev = latestHistory.snapshot;

      // Expenses Trend
      if (profile.expenses > (prev.expenses || 0) && prev.expenses > 0) {
        const delta = ((profile.expenses - prev.expenses) / prev.expenses) * 100;
        if (delta > 5) { // Only alert if change > 5%
          insights.push(`Trend Alert: Your expenses increased by ${delta.toFixed(1)}% compared to your last update.`);
        }
      } else if (profile.expenses < (prev.expenses || 0) && profile.expenses > 0) {
        const delta = ((prev.expenses - profile.expenses) / prev.expenses) * 100;
        if (delta > 5) {
          insights.push(`Positive Trend: Your expenses decreased by ${delta.toFixed(1)}%. Great job controlling outbound cash flow.`);
        }
      }

      // Income Trend
      if (profile.income < (prev.income || 0) && profile.income > 0) {
        const delta = (((prev.income || 0) - profile.income) / (prev.income || 1)) * 100;
        if (delta > 5) {
          insights.push(`Trend Alert: Your income decreased by ${delta.toFixed(1)}%. Ensure your budget is adjusted accordingly.`);
        }
      } else if (profile.income > (prev.income || 0) && (prev.income || 0) > 0) {
          insights.push(`Positive Trend: Your tracked income has increased. Consider routing the surplus directly to investments.`);
      }

      // Net Worth Trend
      try {
        const prevTotalAssets = (prev.assets?.stocks?.reduce((acc: number, s: any) => acc + (s.quantity * (s.currentPrice || s.buyPrice)), 0) || 0) + (prev.assets?.gold || 0);
        const prevLiabilities = prev.loans?.reduce((acc: number, l: any) => acc + l, 0) || 0;
        const prevNetWorth = prevTotalAssets - prevLiabilities;
        
        if (netWorth > prevNetWorth && prevNetWorth !== 0) {
          insights.push(`Positive trajectory: Your net worth improved by ₹${(netWorth - prevNetWorth).toLocaleString("en-IN")}.`);
        } else if (netWorth < prevNetWorth) {
          insights.push(`Net Worth Drop: Your net worth decreased by ₹${(prevNetWorth - netWorth).toLocaleString("en-IN")}. Keep an eye on asset valuations and new debt.`);
        }
      } catch(e) {
        // Safe fail
      }
    }
  }

  // FINAL SCORE
  insights.push(`Financial Health Score: ${fhs}/100`);

  return insights;
}
