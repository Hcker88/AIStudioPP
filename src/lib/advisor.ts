import { FullProfile } from './types.ts';
import { calculateSavingsRate, calculateDebtToIncomeRatio, calculateFHS } from './financialEngine.ts';

export function getNextBestAction(profile: FullProfile): string {
  const savingsRate = calculateSavingsRate(profile);
  const debtRatio = calculateDebtToIncomeRatio(profile);
  const fhs = calculateFHS(profile);

  // PRIORITY-BASED DECISION

  if (debtRatio > 0.6) {
    return "Priority: Reduce high-interest debt before increasing investments.";
  }

  if (savingsRate < 0.2) {
    return "Increase your monthly savings. Even a 10% adjustment will significantly improve your trajectory.";
  }

  if (profile.holdings.length === 0) {
    return "You currently have no growth assets. Consider allocating a portion into equities.";
  }

  if (fhs > 80) {
    return "You are in a strong position. Focus on scaling investments and long-term wealth growth.";
  }

  return "Maintain current strategy and continue monitoring your financial position.";
}
