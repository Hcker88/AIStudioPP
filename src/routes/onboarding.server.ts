import { z } from 'zod';
import { db } from '../lib/db';
import { financialProfiles, loans, expenses } from '../lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Zod Schema for Onboarding Interrogation
 */
export const OnboardingSchema = z.object({
  userId: z.string().uuid(),
  monthlyIncome: z.number().nonnegative(),
  loans: z.array(z.object({
    name: z.string().min(1),
    principal: z.number().nonnegative(),
    interestRate: z.number().min(0).max(100),
    emi: z.number().nonnegative(),
    tenure: z.number().int().nonnegative(),
  })),
  expenses: z.array(z.object({
    category: z.string().min(1),
    amount: z.number().nonnegative(),
    isFixed: z.boolean(),
  })),
});

/**
 * Onboarding Action Logic
 * Handles the upsert of financial data in a single transaction.
 */
export async function handleOnboardingAction(data: any) {
  const result = OnboardingSchema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }

  const { userId, monthlyIncome, loans: loanData, expenses: expenseData } = result.data;

  // 1. Calculate Debt-to-Income for Risk Flagging
  const totalMonthlyDebt = loanData.reduce((acc, l) => acc + l.emi, 0);
  const dti = totalMonthlyDebt / monthlyIncome;
  const isHighRisk = dti > 0.5;

  // 2. Execute Transaction
  return await db.transaction(async (tx) => {
    // Upsert Profile
    const [profile] = await tx.insert(financialProfiles)
      .values({
        userId,
        monthlyIncome: monthlyIncome.toString(),
        lastSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: financialProfiles.userId,
        set: { 
          monthlyIncome: monthlyIncome.toString(),
          lastSyncedAt: new Date() 
        }
      })
      .returning();

    // Clear existing loans/expenses for a clean re-sync
    await tx.delete(loans).where(eq(loans.profileId, profile.id));
    await tx.delete(expenses).where(eq(expenses.profileId, profile.id));

    // Insert Loans
    if (loanData.length > 0) {
      await tx.insert(loans).values(
        loanData.map(l => ({
          profileId: profile.id,
          name: l.name,
          principalAmount: l.principal.toString(),
          interestRate: l.interestRate.toString(),
          monthlyEmi: l.emi.toString(),
          remainingTenureMonths: l.tenure,
        }))
      );
    }

    // Insert Expenses
    if (expenseData.length > 0) {
      await tx.insert(expenses).values(
        expenseData.map(e => ({
          profileId: profile.id,
          category: e.category,
          amount: e.amount.toString(),
          isFixed: e.isFixed,
        }))
      );
    }

    return { success: true, isHighRisk, dti };
  });
}

/**
 * AI Tool: generate_onboarding_welcome()
 * Creates a personalized "First Login" greeting from the AI.
 */
export async function generateOnboardingWelcome(userId: string, userName: string = "User") {
  const profile = await db.query.financialProfiles.findFirst({
    where: eq(financialProfiles.userId, userId),
  });

  if (!profile) {
    return `Welcome, ${userName}. Let's start by looking at your liabilities to find your first interest-saving opportunity.`;
  }

  const userLoans = await db.query.loans.findMany({
    where: eq(loans.profileId, profile.id),
  });

  if (userLoans.length === 0) {
    return `Welcome, ${userName}. Let's start by looking at your liabilities to find your first interest-saving opportunity.`;
  }

  const totalDailyInterest = userLoans.reduce((acc, l) => {
    const rate = parseFloat(l.interestRate) / 100;
    const principal = parseFloat(l.principalAmount);
    return acc + (principal * rate) / 365;
  }, 0);

  const primaryLoan = userLoans.sort((a, b) => parseFloat(b.interestRate) - parseFloat(a.interestRate))[0];

  return `${userName}, you're currently losing ₹${Math.round(totalDailyInterest).toLocaleString('en-IN')} every day to interest. My first mission is to get that number to zero. Let’s look at your ${primaryLoan.name} loan first.`;
}
