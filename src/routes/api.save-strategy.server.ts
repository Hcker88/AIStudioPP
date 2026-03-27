import { db } from '../lib/db';
import { savedStrategies } from '../lib/schema';
import { z } from 'zod';

const SaveStrategySchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  debtInterestRate: z.number(),
  projectedRoi: z.number(),
  extraMonthlyPayment: z.number(),
});

export async function saveStrategy(data: any) {
  const result = SaveStrategySchema.safeParse(data);
  if (!result.success) throw new Error('Invalid strategy data');

  const { userId, name, debtInterestRate, projectedRoi, extraMonthlyPayment } = result.data;

  return await db.insert(savedStrategies).values({
    userId,
    name,
    debtInterestRate: debtInterestRate.toString(),
    projectedRoi: projectedRoi.toString(),
    extraMonthlyPayment: extraMonthlyPayment.toString(),
  }).returning();
}
