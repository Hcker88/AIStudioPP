/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FinancialData {
  totalDebt: number;
  monthlyIncome: number;
  expenses: number;
}

interface StrategyContextType {
  extraMonthly: number;
  setExtraMonthly: (value: number) => void;
  lastSyncMessage: string | null;
  setLastSyncMessage: (message: string | null) => void;
  isPrivacyMode: boolean;
  setIsPrivacyMode: (value: boolean) => void;
  highlightedCard: string | null;
  setHighlightedCard: (value: string | null) => void;
  financialData: FinancialData;
  setFinancialData: (data: FinancialData) => void;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [extraMonthly, setExtraMonthly] = useState(25000); // Default for Indian context
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalDebt: 0,
    monthlyIncome: 0,
    expenses: 0
  });

  return (
    <StrategyContext.Provider value={{ 
      extraMonthly, 
      setExtraMonthly, 
      lastSyncMessage, 
      setLastSyncMessage,
      isPrivacyMode,
      setIsPrivacyMode,
      highlightedCard,
      setHighlightedCard,
      financialData,
      setFinancialData
    }}>
      {children}
    </StrategyContext.Provider>
  );
}

export function useStrategy() {
  const context = useContext(StrategyContext);
  if (context === undefined) {
    throw new Error('useStrategy must be used within a StrategyProvider');
  }
  return context;
}
