import { logger } from '../config/logger';

export interface DecisionInsight {
  state: string;
  reason: string;
  recommendation: string;
}

export const calculateFreedomDate = (principal: number, monthlyPayment: number, annualInterestRate: number): number => {
  const monthlyInterestRate = annualInterestRate / 12 / 100;
  if (monthlyPayment <= principal * monthlyInterestRate) {
    return Infinity;
  }
  const t = Math.log(monthlyPayment / (monthlyPayment - monthlyInterestRate * principal)) / Math.log(1 + monthlyInterestRate);
  return Math.ceil(t);
};

export const generateDecisionInsight = (principal: number, monthlyPayment: number, annualInterestRate: number): DecisionInsight => {
  const months = calculateFreedomDate(principal, monthlyPayment, annualInterestRate);
  
  if (months === Infinity) {
    return {
      state: 'CRITICAL',
      reason: 'Current payment is insufficient to cover monthly interest, causing debt to grow.',
      recommendation: 'Increase your monthly payment to at least ₹' + Math.ceil(principal * (annualInterestRate / 12 / 100) + 1) + ' to begin reducing principal.'
    };
  }
  
  if (months > 60) {
    return {
      state: 'WARNING',
      reason: `Debt-free date is ${months} months away, which is a long-term commitment.`,
      recommendation: 'Consider increasing your monthly payment by ₹2,000 to reduce interest costs and shorten the timeline significantly.'
    };
  }

  return {
    state: 'OPTIMAL',
    reason: `You are on track to be debt-free in ${months} months.`,
    recommendation: 'Maintain this payment schedule. If you receive a bonus, consider making a lump-sum payment to accelerate your freedom date.'
  };
};
