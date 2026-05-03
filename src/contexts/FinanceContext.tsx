import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { fetchFullProfile, applyParsedUpdates, createFullProfile, saveInsights, updateUserMetrics } from '../lib/persistence.ts';
import { FullProfile, Insight } from '../lib/types.ts';
import { calculateMetrics } from '../lib/financialEngine.ts';
import { generateInsights } from '../lib/insightsEngine.ts';

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

    // 1. Send to generic parser
    const res = await fetch('/api/ai/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, profileContext: profile })
    });
    
    if (!res.ok) return "Sorry, my financial engines are down. Please try again later.";

    const { data } = await res.json();
    
    if (data && data.extractedEntities && Object.keys(data.extractedEntities).length > 0) {
      // 2. Persist extracted objects
      await applyParsedUpdates(user.uid, data.extractedEntities);
      
      // Re-fetch active profile 
      const updatedProfile = await fetchFullProfile(user.uid);
      if (updatedProfile) {
        // 3. Recalculate metrics
        const metrics = calculateMetrics(updatedProfile);
        
        // Update user metrics in DB
        await updateUserMetrics(user.uid, metrics);
        updatedProfile.user.metrics = metrics;

        // 4. Generate Insights
        const insights = generateInsights(updatedProfile);
        await saveInsights(user.uid, insights);
        updatedProfile.insights = insights;

        setProfile(updatedProfile);

        // 5. Contextual response
        return `I've updated your financial profile! Your new Net Worth is ₹${metrics.netWorth.toLocaleString('en-IN')}, and I have generated ${insights.length} new insights for you. Check your dashboard!`;
      }
    }

    return "I couldn't detect any specific financial updates in that message, but I'll keep it in mind!";
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
