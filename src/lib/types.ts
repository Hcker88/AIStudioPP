export interface UserProfile {
  userId: string;
  email: string;
  name?: string;
  age?: number;
  occupation?: string;
  riskProfile?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  metrics?: {
    netWorth?: number;
    monthlyCashFlow?: number;
    savingsRate?: number;
    debtToIncomeRatio?: number;
    financialHealthScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id?: string;
  userId: string;
  source: string;
  amount: number;
  frequency: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id?: string;
  userId: string;
  category: string;
  amount: number;
  isFixed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id?: string;
  userId: string;
  name: string;
  principalAmount: number;
  interestRate: number;
  monthlyEmi: number;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id?: string;
  userId: string;
  name: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  cycle: 'MONTHLY' | 'YEARLY';
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentHolding {
  id?: string;
  userId: string;
  symbol: string;
  assetName: string;
  assetType: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialGoal {
  id?: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentSavings: number;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id?: string;
  userId: string;
  content: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface FullProfile {
  user: UserProfile;
  incomes: Income[];
  expenses: Expense[];
  loans: Loan[];
  assets: Asset[];
  subscriptions: Subscription[];
  holdings: InvestmentHolding[];
  goals: FinancialGoal[];
  insights: Insight[];
}
