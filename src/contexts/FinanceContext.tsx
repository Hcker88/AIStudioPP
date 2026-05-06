import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { fetchFullProfile, applyParsedUpdates, createFullProfile, saveInsights, updateUserMetrics } from '../lib/persistence.ts';
import { FullProfile, Insight } from '../lib/types.ts';
import { calculateMetrics } from '../lib/financialEngine.ts';
import { generateInsights } from '../lib/insightsEngine.ts';
import { parseMessage } from '../lib/localParser.ts';
import { getNextBestAction } from '../lib/advisor.ts';

interface FinanceContextType {
  user: any;
  profile: FullProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  processChatMessage: (message: string) => Promise<string>;
  refreshProfile: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    let p = await fetchFullProfile(uid);
    if (!p) {
      p = await createFullProfile(uid, auth.currentUser?.email || 'unknown');
    }
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

    // 1. Parse input
    const extractedEntities = parseMessage(message, profile);
    
    // Check if any updates exist
    const hasUpdates = Object.values(extractedEntities).some((arr: any) => arr && arr.length > 0);

    if (hasUpdates) {
      // 2. Persist 
      await applyParsedUpdates(user.uid, extractedEntities);
      
      // Re-fetch active profile to get fresh data including past data
      const updatedProfile = await fetchFullProfile(user.uid);
      if (updatedProfile) {
        const metrics = calculateMetrics(updatedProfile);
        await updateUserMetrics(user.uid, metrics);
        updatedProfile.user.metrics = metrics;

        // 3. Generate Insights
        const insights = generateInsights(updatedProfile);
        await saveInsights(user.uid, insights);
        updatedProfile.insights = insights;

        setProfile(updatedProfile);

        // 4. Killer Feature: Next Best Action
        const action = getNextBestAction(updatedProfile);
        
        // Format response exactly as requested
        const insightMessages = insights.map(i => i.content);
        return insightMessages.join(" ") + "\n\nNext Step: " + action;
      }
    } else {
      // Return insight and action even if no new items added
      const insights = generateInsights(profile);
      const action = getNextBestAction(profile);
      const insightMessages = insights.map(i => i.content);
      return insightMessages.join(" ") + "\n\nNext Step: " + action;
    }

    return "I couldn't process your financial updates. Please try again.";
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
