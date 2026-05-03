import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import { FullProfile, UserProfile, Income, Expense, Loan, Asset, Subscription, InvestmentHolding, FinancialGoal, Insight } from './types.ts';

export async function fetchFullProfile(userId: string): Promise<FullProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;

    const profileData = userDoc.data() as UserProfile;

    const [incomes, expenses, loans, assets, subscriptions, holdings, goals, insights] = await Promise.all([
      getDocs(collection(db, `users/${userId}/incomes`)),
      getDocs(collection(db, `users/${userId}/expenses`)),
      getDocs(collection(db, `users/${userId}/loans`)),
      getDocs(collection(db, `users/${userId}/assets`)),
      getDocs(collection(db, `users/${userId}/subscriptions`)),
      getDocs(collection(db, `users/${userId}/holdings`)),
      getDocs(collection(db, `users/${userId}/goals`)),
      getDocs(collection(db, `users/${userId}/insights`)),
    ]);

    return {
      user: profileData,
      incomes: incomes.docs.map(d => ({ id: d.id, ...d.data() } as Income)),
      expenses: expenses.docs.map(d => ({ id: d.id, ...d.data() } as Expense)),
      loans: loans.docs.map(d => ({ id: d.id, ...d.data() } as Loan)),
      assets: assets.docs.map(d => ({ id: d.id, ...d.data() } as Asset)),
      subscriptions: subscriptions.docs.map(d => ({ id: d.id, ...d.data() } as Subscription)),
      holdings: holdings.docs.map(d => ({ id: d.id, ...d.data() } as InvestmentHolding)),
      goals: goals.docs.map(d => ({ id: d.id, ...d.data() } as FinancialGoal)),
      insights: insights.docs.map(d => ({ id: d.id, ...d.data() } as Insight)),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId} and subcollections`);
    return null;
  }
}

export async function updateUserMetrics(userId: string, metrics: UserProfile['metrics']) {
  try {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, { metrics, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function createFullProfile(userId: string, email: string): Promise<FullProfile> {
  const newUser: UserProfile = {
    userId,
    email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metrics: { netWorth: 0, monthlyCashFlow: 0, savingsRate: 0, debtToIncomeRatio: 0, financialHealthScore: 50 }
  };
  
  try {
    await setDoc(doc(db, 'users', userId), newUser);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${userId}`);
  }

  return {
    user: newUser,
    incomes: [], expenses: [], loans: [], assets: [], subscriptions: [], holdings: [], goals: [], insights: []
  };
}

export async function applyParsedUpdates(userId: string, updates: any) {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    if (updates.incomes) {
      updates.incomes.forEach((inc: any) => {
        const ref = doc(collection(db, `users/${userId}/incomes`));
        batch.set(ref, { ...inc, userId, createdAt: now, updatedAt: now });
      });
    }
    if (updates.expenses) {
      updates.expenses.forEach((exp: any) => {
        const ref = doc(collection(db, `users/${userId}/expenses`));
        batch.set(ref, { ...exp, userId, createdAt: now, updatedAt: now });
      });
    }
    if (updates.loans) {
      updates.loans.forEach((loan: any) => {
        const ref = doc(collection(db, `users/${userId}/loans`));
        batch.set(ref, { ...loan, userId, createdAt: now, updatedAt: now });
      });
    }
    if (updates.assets) {
      updates.assets.forEach((asset: any) => {
        const ref = doc(collection(db, `users/${userId}/assets`));
        batch.set(ref, { ...asset, userId, createdAt: now, updatedAt: now });
      });
    }
    if (updates.subscriptions) {
      updates.subscriptions.forEach((sub: any) => {
        const ref = doc(collection(db, `users/${userId}/subscriptions`));
        batch.set(ref, { ...sub, userId, createdAt: now, updatedAt: now });
      });
    }
    if (updates.holdings) {
      updates.holdings.forEach((holding: any) => {
        const ref = doc(collection(db, `users/${userId}/holdings`));
        batch.set(ref, { ...holding, userId, createdAt: now, updatedAt: now });
      });
    }
    if (updates.goals) {
      updates.goals.forEach((goal: any) => {
        const ref = doc(collection(db, `users/${userId}/goals`));
        batch.set(ref, { ...goal, userId, createdAt: now, updatedAt: now });
      });
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/subcollections via batch`);
  }
}

export async function saveInsights(userId: string, insights: Insight[]) {
  try {
    const batch = writeBatch(db);
    
    // Optional: Delete old insights first to keep it fresh
    const oldInsights = await getDocs(collection(db, `users/${userId}/insights`));
    oldInsights.forEach(d => batch.delete(d.ref));

    insights.forEach(ins => {
      const ref = doc(collection(db, `users/${userId}/insights`));
      batch.set(ref, { ...ins, userId });
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/insights batch`);
  }
}
