import { FullProfile, Income, Expense, Loan, Asset, InvestmentHolding, FinancialGoal } from './types.ts';

/**
 * Advanced Parser (REAL-WORLD READY)
 * Handles messy inputs, ranges, multiple values
 */
export function parseMessage(message: string, profile: FullProfile): any {
  const text = message.toLowerCase();
  
  const updates: any = {
    incomes: [],
    expenses: [],
    loans: [],
    assets: [],
    holdings: [],
    goals: []
  };

  const extractNumbers = (str: string): number[] => {
    let matches = str.match(/[\d,.]+/g);
    if (!matches) return [];
    return matches.map(num => parseFloat(num.replace(/,/g, "")));
  };

  const normalizeAmount = (textStr: string, value: number) => {
    if (textStr.includes("lakh")) return value * 100000;
    if (textStr.includes("k")) return value * 1000;
    return value;
  };

  // ===== INCOME =====
  if (text.includes("earn") || text.includes("salary") || text.includes("make")) {
    let nums = extractNumbers(text);
    let amount = 0;
    if (nums.length === 1) {
      amount = normalizeAmount(text, nums[0]);
    } else if (nums.length >= 2) {
      amount = normalizeAmount(text, (nums[0] + nums[1]) / 2);
    }
    
    if (amount > 0) {
      updates.incomes.push({
        source: 'Manual Entry',
        amount,
        frequency: 'MONTHLY'
      });
    }
  }

  // ===== EXPENSES =====
  if (text.includes("spend") || text.includes("expense")) {
    let nums = extractNumbers(text);
    if (nums.length > 0) {
      const amount = normalizeAmount(text, nums[0]);
      updates.expenses.push({
        category: 'Manual Entry',
        amount,
        isFixed: false
      });
    }
  }

  // ===== LOANS =====
  if (text.includes("loan") || text.includes("debt")) {
    let nums = extractNumbers(text);
    nums.forEach(n => {
      const amount = normalizeAmount(text, n);
      updates.loans.push({
        name: 'Manual Loan',
        principalAmount: amount,
        interestRate: 12,
        monthlyEmi: amount * 0.05
      });
    });
  }

  // ===== GOLD =====
  if (text.includes("gold")) {
    let nums = extractNumbers(text);
    if (nums.length > 0) {
      const amount = normalizeAmount(text, nums[0]);
      updates.assets.push({
        name: 'Gold',
        value: amount
      });
    }
  }

  // ===== STOCK DETECTION =====
  if (text.includes("buy") || text.includes("bought")) {
    let nums = extractNumbers(text);
    if (nums.length >= 2) {
      updates.holdings.push({
        symbol: 'NEW_STOCK',
        assetName: 'Manual Entry',
        assetType: 'EQUITY',
        quantity: nums[0],
        buyPrice: nums[1],
        currentPrice: nums[1]
      });
    }
  }

  // ===== GOALS =====
  if (text.includes("goal") || text.includes("want")) {
    updates.goals.push({
      name: message,
      targetAmount: 0,
      currentSavings: 0,
      targetDate: new Date(Date.now() + 31536000000).toISOString()
    });
  }

  return updates;
}
