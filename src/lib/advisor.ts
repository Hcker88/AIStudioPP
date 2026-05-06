import { UserProfileSchema } from "./types";
import { calculateSavingsRate, calculateDebtRatio, calculateFHS } from "./finance";

export function getNextBestAction(profile: UserProfileSchema): string {
  const savingsRate = calculateSavingsRate(profile);

  // 1. Debt Priority
  if (profile.loans && profile.loans.length > 0) {
    return "Priority Action: Dedicate your surplus cash strictly toward paying off your highest-interest debt.";
  }

  // 2. Savings Priority
  if (savingsRate < 0.2) {
    return "Priority Action: Cut non-essential spending to increase your savings rate to at least 20%.";
  }

  // 3. Investment Priority
  if (!profile.assets.stocks || profile.assets.stocks.length === 0) {
    return "Priority Action: Begin allocating your surplus into market-oriented equity assets for compound growth.";
  }

  // 4. Optimization Priority
  return "Priority Action: You are in an optimized state. Focus on maximizing income and tax-efficient wealth growth.";
}

