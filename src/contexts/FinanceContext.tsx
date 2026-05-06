import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfileSchema } from '../lib/types';
import { parseMessage } from '../lib/parser';
import { calculateNetWorth, calculateSavingsRate, calculateDebtRatio, calculateFHS } from '../lib/finance';
import { generateInsights } from '../lib/insights';
import { getNextBestAction } from '../lib/advisor';
import { fetchUserProfile, saveUserProfile } from '../lib/profileDb';

interface FinanceContextType {
  user: any;
  profile: UserProfileSchema | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  processChatMessage: (message: string) => Promise<string>;
  refreshProfile: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfileSchema | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const p = await fetchUserProfile(uid);
    // Auto-calculate metrics on load
    const netWorth = calculateNetWorth(p);
    const savingsRate = calculateSavingsRate(p);
    const debtRatio = calculateDebtRatio(p);
    const fhs = calculateFHS(p);
    p.metrics = { netWorth, savingsRate, debtRatio, financialHealthScore: fhs };
    
    const insights = generateInsights(p);
    p.insights = insights;
    
    setProfile(p);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.uid);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'auth');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const processChatMessage = async (message: string): Promise<string> => {
    if (!user || !profile) return "Please login first.";

    try {
      // 1. & 2. Parse input and extract data safely
      const updatedProfile = parseMessage(message, profile);
      
      // 3. Recalculate metrics
      const netWorth = calculateNetWorth(updatedProfile);
      const savingsRate = calculateSavingsRate(updatedProfile);
      const debtRatio = calculateDebtRatio(updatedProfile);
      const fhs = calculateFHS(updatedProfile);
      updatedProfile.metrics = { netWorth, savingsRate, debtRatio, financialHealthScore: fhs };
      
      // 4. Generate intelligent insights
      const insights = generateInsights(updatedProfile);
      updatedProfile.insights = insights;

      // 5. Generate Next Best Action
      const action = getNextBestAction(updatedProfile);

      // 6. Save to Firebase (Single Source of Truth)
      await saveUserProfile(user.uid, updatedProfile);

      // Refresh real-time UI state
      setProfile(updatedProfile);

      // 7. Return structured, meaningful response
      return `${insights.join(" ")}\n\nNext Step: ${action}`;
      
    } catch (e: any) {
      console.error("Pipeline failure:", e);
      return e.message || "I encountered an issue processing your data. Could you please specify it clearly again?";
    }
  };

  return (
    <FinanceContext.Provider value={{ user, profile, loading, login, logout, processChatMessage, refreshProfile }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

