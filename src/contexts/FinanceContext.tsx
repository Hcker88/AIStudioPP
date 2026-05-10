import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfileSchema } from '../lib/types';
import { parseMessage } from '../lib/parser';
import { calculateNetWorth, calculateSavingsRate, calculateDebtRatio, calculateFHS } from '../lib/finance';
import { generateInsights } from '../lib/insights';
import { getNextBestAction } from '../lib/advisor';
import { fetchUserProfile, saveUserProfile } from '../lib/profileDb';


export interface ChatResponse {
  insights: string[];
  nextAction: string;
  summary: string;
}

interface FinanceContextType {
  user: any;
  profile: UserProfileSchema | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  processChatMessage: (message: string) => Promise<ChatResponse>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfileSchema>) => Promise<void>;
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

  const processChatMessage = async (message: string): Promise<ChatResponse> => {
    if (!user || !profile) {
      throw new Error("Please login first.");
    }

    try {
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("report") || lowerMsg.includes("summary") || lowerMsg.includes("weekly")) {
         const nw = calculateNetWorth(profile);
         const sr = calculateSavingsRate(profile);
         const dr = calculateDebtRatio(profile);
         
         let changeText = "Here is your latest summary based on our last snapshot:";
         if (profile.history && profile.history.length > 0) {
            const prev = profile.history[profile.history.length - 1].snapshot;
            const prevTotalAssets = (prev.assets?.stocks?.reduce((acc: number, s: any) => acc + (s.quantity * (s.currentPrice || s.buyPrice)), 0) || 0) + (prev.assets?.gold || 0);
            const prevLiabilities = prev.loans?.reduce((acc: number, l: any) => acc + l, 0) || 0;
            const prevNetWorth = prevTotalAssets - prevLiabilities;
            const prevSavingsRate = prev.income ? (prev.income - prev.expenses) / prev.income : 0;
            
            changeText = `📊 **Weekly Report**\n• Net Worth: ₹${nw.toLocaleString("en-IN")} ` + 
                         (nw >= prevNetWorth ? `(Up by ₹${(nw - prevNetWorth).toLocaleString("en-IN")})` : `(Down by ₹${(prevNetWorth - nw).toLocaleString("en-IN")})`) + 
                         `\n• Savings Rate: ${(sr * 100).toFixed(1)}% ` +
                         (sr >= prevSavingsRate ? `(Improved)` : `(Dropped)`) +
                         `\n• FHS: ${profile.metrics?.financialHealthScore || calculateFHS(profile)}/100`;
         } else {
            changeText = `📊 **Summary**\n• Net Worth: ₹${nw.toLocaleString("en-IN")}\n• Savings Rate: ${(sr * 100).toFixed(1)}%\n• Debt Ratio: ${(dr * 100).toFixed(1)}%\n• FHS: ${profile.metrics?.financialHealthScore || calculateFHS(profile)}/100`;
         }
         return {
           insights: [],
           nextAction: getNextBestAction(profile),
           summary: changeText
         };
      }

      // 1. & 2. Parse input and extract data safely
      const { updatedProfile, identifiedIntent } = parseMessage(message, profile);
      
      if (!identifiedIntent) {
        const profileSummaryStr = `Net Worth: ₹${profile.metrics?.netWorth}
Income: ₹${profile.income}
Expenses: ₹${profile.expenses}
Loans: ${JSON.stringify(profile.loans)}
Assets: ${JSON.stringify(profile.assets)}`;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history: profile.chatHistory || [],
            profileSummary: profileSummaryStr,
          })
        });
        
        let responseData = { text: "I'm here to help." };
        if (response.ok) {
           responseData = await response.json();
        }
        
        return {
           insights: [],
           nextAction: "",
           summary: responseData.text || "I'm here to help."
        };
      }

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

      // Auto-trigger weekly/checkpoint report on every 5th valid history snapshot update
      // Since it's cloned, history isn't updated here until save, but we check if we should trigger
      let extraReportText = "Profile updated successfully.";
      if (profile.history && profile.history.length > 0 && profile.history.length % 5 === 0) {
        // Build an automated baseline report
        const latestHistory = profile.history[profile.history.length - 1]; // Before this current update
        const prev = latestHistory.snapshot;
        const prevTotalAssets = (prev.assets?.stocks?.reduce((acc: number, s: any) => acc + (s.quantity * (s.currentPrice || s.buyPrice)), 0) || 0) + (prev.assets?.gold || 0);
        const prevLiabilities = prev.loans?.reduce((acc: number, l: any) => acc + l, 0) || 0;
        const prevNetWorth = prevTotalAssets - prevLiabilities;
         
        extraReportText += `\n\n📊 **Checkpoint Report (Every 5 updates)**\n` +
                          `• Net Worth Status: ₹${netWorth.toLocaleString("en-IN")} ` + 
                          (netWorth >= prevNetWorth ? `(Up by ₹${(netWorth - prevNetWorth).toLocaleString("en-IN")})` : `(Down)`) + `\n` +
                          `• Current FHS: ${fhs}/100`;
      }

      // 6. Save to Firebase (Single Source of Truth)
      await saveUserProfile(user.uid, updatedProfile);

      // Refresh real-time UI state
      setProfile(updatedProfile);

      // 7. Return structured, meaningful response
      return {
        insights,
        nextAction: action,
        summary: extraReportText
      };
      
    } catch (e: any) {
      console.error("Pipeline failure:", e);
      throw new Error(e.message || "I encountered an issue processing your data. Could you please specify it clearly again?");
    }
  };

  const updateProfile = async (updates: Partial<UserProfileSchema>): Promise<void> => {
    if (!user || !profile) return;
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    try {
      await saveUserProfile(user.uid, updatedProfile);
    } catch (e) {
      console.error("Failed to save profile updates:", e);
      // optionally revert
    }
  };

  return (
    <FinanceContext.Provider value={{ user, profile, loading, login, logout, processChatMessage, refreshProfile, updateProfile }}>
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

