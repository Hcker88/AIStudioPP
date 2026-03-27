import { pgTable, serial, text, timestamp, integer, numeric, uuid, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  googleId: text('google_id').unique(),
  disciplineScore: integer('discipline_score').default(50).notNull(),
  streakMonths: integer('streak_months').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const financialProfiles = pgTable('financial_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  monthlyIncome: numeric('monthly_income', { precision: 12, scale: 2 }).notNull(),
  targetEquityAllocation: numeric('target_equity_allocation', { precision: 5, scale: 2 }).default('70').notNull(),
  lastSyncedAt: timestamp('last_synced_at').defaultNow().notNull(),
  currency: text('currency').default('INR').notNull(),
});

export const loans = pgTable('loans', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => financialProfiles.id).notNull(),
  name: text('name').notNull(), // e.g., "Home Loan", "Credit Card"
  principalAmount: numeric('principal_amount', { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(), // Annual percentage
  monthlyEmi: numeric('monthly_emi', { precision: 12, scale: 2 }).notNull(),
  remainingTenureMonths: integer('remaining_tenure_months').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => financialProfiles.id).notNull(),
  category: text('category').notNull(), // e.g., "Rent", "Groceries"
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  isFixed: boolean('is_fixed').default(true).notNull(),
});

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').default('New Strategy Session'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => chatSessions.id).notNull(),
  role: text('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const savedStrategies = pgTable('saved_strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  debtInterestRate: numeric('debt_interest_rate', { precision: 5, scale: 2 }).notNull(),
  projectedRoi: numeric('projected_roi', { precision: 5, scale: 2 }).notNull(),
  extraMonthlyPayment: numeric('extra_monthly_payment', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const financialGoals = pgTable('financial_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  targetAmount: numeric('target_amount', { precision: 15, scale: 2 }).notNull(),
  targetDate: timestamp('target_date').notNull(),
  priority: text('priority').default('MEDIUM').notNull(), // 'HIGH', 'MEDIUM', 'LOW'
  currentSavings: numeric('current_savings', { precision: 15, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sinkingFunds = pgTable('sinking_funds', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(), // e.g., "Annual Insurance", "Diwali Shopping"
  targetAmount: numeric('target_amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  monthlyContribution: numeric('monthly_contribution', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const households = pgTable('households', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  emergencyFund: numeric('emergency_fund', { precision: 15, scale: 2 }).default('0').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const householdMembers = pgTable('household_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: text('role').notNull(), // 'PRIMARY', 'CONTRIBUTOR'
  shareDebtDetails: boolean('share_debt_details').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const portfolioAssets = pgTable('portfolio_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => financialProfiles.id).notNull(),
  assetName: text('asset_name').notNull(), // e.g., "Nifty 50 Index Fund", "HDFC Savings"
  assetType: text('asset_type').notNull(), // 'EQUITY', 'DEBT', 'CASH'
  institution: text('institution').notNull(), // 'ZERODHA', 'ICICI', 'HDFC'
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const legacyVault = pgTable('legacy_vault', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  nomineeEmail: text('nominee_email').notNull(),
  encryptedInstructions: text('encrypted_instructions').notNull(), // AES-256 simulated
  lastCheckIn: timestamp('last_check_in').defaultNow().notNull(),
  deadMansSwitchDays: integer('dead_mans_switch_days').default(30).notNull(),
  isTriggered: boolean('is_triggered').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adviceAttribution = pgTable('advice_attribution', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  adviceType: text('advice_type').notNull(), // e.g., "PREPAY_LOAN"
  adviceContent: text('advice_content').notNull(),
  targetLoanId: uuid('target_loan_id').references(() => loans.id),
  ignoreCount: integer('ignore_count').default(0).notNull(),
  isFollowed: boolean('is_followed').default(false).notNull(),
  lastOfferedAt: timestamp('last_offered_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const failedReasoning = pgTable('failed_reasoning', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  aiResponse: text('ai_response').notNull(),
  userFeedback: text('user_feedback'), // "THUMBS_DOWN"
  context: text('context').notNull(), // Sanitized context
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const marketSnapshots = pgTable('market_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  nifty50: numeric('nifty_50', { precision: 12, scale: 2 }).notNull(),
  repoRate: numeric('repo_rate', { precision: 5, scale: 2 }).notNull(),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
});
