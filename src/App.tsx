/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  MessageSquare, 
  PieChart, 
  ArrowRight,
  Wallet,
  CreditCard,
  Plus,
  Trash2,
  LayoutDashboard,
  Target,
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  FileText,
  Flag,
  CalendarDays,
  Sparkles,
  Shield,
  ShieldCheck,
  Lock,
  Zap,
  Clock,
  ArrowUpRight,
  Trophy
} from 'lucide-react';
import { StatCard } from './components/ui/StatCard';
import { LoanRow } from './components/ui/LoanRow';
import { StaleDataWarning } from './components/ui/StaleDataWarning';
import { AdvisoryChat } from './components/chat/AdvisoryChat';
import { StrategyVisualizer } from './components/dashboard/StrategyVisualizer';
import { ScenarioMatrix } from './components/dashboard/ScenarioMatrix';
import { CommunityPulse } from './components/dashboard/CommunityPulse';
import { InterestSavedChart } from './components/dashboard/InterestSavedChart';
import { GlobalSearch } from './components/ui/GlobalSearch';
import { StrategyProvider, useStrategy } from './contexts/StrategyContext';
import { monteCarloSimulator } from './lib/monteCarlo';
import { LIFE_EVENT_TEMPLATES, lifeEventSimulator } from './lib/lifeEvents';
import { formatINR } from './lib/formatters';
import { cn } from './lib/utils';
import { systemAudit } from './lib/systemAudit';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { DashboardSkeleton } from './components/ui/Skeleton';
import { Leaderboard } from './components/marketing/Leaderboard';
import { SecurityPage } from './routes/security';
import { StatusHologram } from './components/ui/StatusHologram';
import { ConversationForm } from './components/onboarding/ConversationForm';
import { SmartActions } from './components/dashboard/SmartActions';
import { YearInReview } from './components/dashboard/YearInReview';
import { FreedomClock } from './components/dashboard/FreedomClock';
import { conciergeLogic } from './lib/ai/concierge';

function DashboardContent() {
  const [step, setStep] = useState(0); // 0: Landing, 1: Interrogation, 2: Dashboard
  const [view, setView] = useState<'APP' | 'SECURITY' | 'LEADERBOARD'>('APP');
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [hookDebt, setHookDebt] = useState<number>(1000000);
  const [hookRate, setHookRate] = useState<number>(12);
  const [activeTab, setActiveTab] = useState<'STRATEGY' | 'GOALS' | 'HOUSEHOLD' | 'ORACLE'>('STRATEGY');
  const [isStale, setIsStale] = useState(false);
  const [isOverBudget, setIsOverBudget] = useState(true); // Mocking over-budget state
  const [confidenceScore, setConfidenceScore] = useState(88);
  const [showConfetti, setShowConfetti] = useState(false);
  const { extraMonthly, setLastSyncMessage, isPrivacyMode, setIsPrivacyMode, highlightedCard, setFinancialData } = useStrategy();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading for skeleton
  const [auditWarning, setAuditWarning] = useState<string | null>(null);
  const [freedomSeconds] = useState(298456320); // Static initial value
  const [netWorthVelocity, setNetWorthVelocity] = useState(12.4); // Mock velocity
  const [showMilestone, setShowMilestone] = useState(false);
  const [isConciergeEnabled, setIsConciergeEnabled] = useState(false);
  const [showYearInReview, setShowYearInReview] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [conciergeMessage, setConciergeMessage] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Mock data for demonstration (Indian context)
  const [loans, setLoans] = useState([
    { name: 'HDFC Home Loan', principal: 4500000, interestRate: 8.5, emi: 38000, tenure: 240 },
    { name: 'ICICI Personal Loan', principal: 500000, interestRate: 14.5, emi: 12000, tenure: 60 },
  ]);

  const income = 150000;
  const expenses = 45000;

  useEffect(() => {
    const totalDebt = loans.reduce((acc, l) => acc + l.principal, 0);
    const monthlyIncome = 120000; // Mock income
    const expenses = 45000; // Mock expenses
    setFinancialData({ totalDebt, monthlyIncome, expenses });

    // Run Audit
    const auditResult = systemAudit.checkInconsistencies(
      loans.map(l => ({ name: l.name, principal: l.principal })),
      expenses,
      monthlyIncome
    );
    if (!auditResult.isValid) {
      setAuditWarning(systemAudit.getAIPrompt(auditResult, "Harshit"));
    } else {
      setAuditWarning(null);
    }
  }, [loans, setFinancialData]);

  useEffect(() => {
    // Simulate initial load for skeleton
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // AI Concierge Idle Detection
  useEffect(() => {
    if (!isConciergeEnabled || step !== 2) return;

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      if (idleTime > 10000 && !conciergeMessage) {
        const message = conciergeLogic.getMessage(activeTab);
        setConciergeMessage(message);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConciergeEnabled, lastActivity, activeTab, conciergeMessage, step]);

  // Reset idle timer on interaction
  useEffect(() => {
    const handleInteraction = () => {
      setLastActivity(Date.now());
      if (conciergeMessage) setConciergeMessage(null);
    };
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [conciergeMessage]);

  const triggerCelebration = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const [portfolioDrift, setPortfolioDrift] = useState({
    currentEquity: 78,
    targetEquity: 70,
    drift: 8,
    totalAssets: 1250000
  });

  const handleSyncAll = async () => {
    setIsSyncing(true);
    // Simulate fetching from ICICI, HDFC, Zerodha
    setTimeout(() => {
      setIsSyncing(false);
      alert("Sync Complete: Fetched balances from ICICI (Savings), HDFC (Home Loan), and Zerodha (Equity). Portfolio Drift updated.");
      setPortfolioDrift(prev => ({ ...prev, currentEquity: 82, drift: 12 }));
    }, 2000);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default-user' }),
      });
      const data = await response.json();
      setLastSyncMessage(data.message);
      alert(data.message);
    } catch (error) {
      console.error('Sync failed', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default-user' }),
      });
      const data = await response.json();
      if (data.success) {
        const link = document.createElement('a');
        link.href = data.pdfBase64;
        link.download = 'Bharat_Financial_Roadmap.pdf';
        link.click();
      }
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E3E0] font-sans selection:bg-[#F27D26] selection:text-black">
      {isStale && <StaleDataWarning />}
      
      {/* Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full w-20 border-r border-white/10 flex flex-col items-center py-8 gap-8 bg-black/50 backdrop-blur-xl z-50">
        <div className="w-10 h-10 bg-[#F27D26] rounded-sm flex items-center justify-center mb-4">
          <TrendingUp className="text-black w-6 h-6" />
        </div>
        <button className="p-3 text-[#F27D26] bg-[#F27D26]/10 rounded-sm"><LayoutDashboard size={20} /></button>
        <button className="p-3 opacity-40 hover:opacity-100 transition-opacity"><Target size={20} /></button>
        <button className="p-3 opacity-40 hover:opacity-100 transition-opacity"><BarChart3 size={20} /></button>
        <div className="mt-auto">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20"></div>
        </div>
      </div>

      <div className="pl-20">
        {/* Navigation */}
        <nav className="border-b border-white/10 p-6 flex justify-between items-center bg-black/20 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tighter text-xl uppercase">DEBTSTRATEGIST<span className="text-[#F27D26]">.AI</span></span>
            </div>
            <GlobalSearch onSearch={(q) => alert(`Oracle searching for: ${q}`)} />
          </div>
          <div className="flex gap-4">
            {/* Executive Briefing Header */}
            <div className="hidden xl:flex items-center gap-8 px-6 border-x border-white/10 mr-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Net Worth Velocity</span>
                <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                  <TrendingUp size={10} /> +{netWorthVelocity}% <span className="text-[8px] opacity-40 font-normal">vs last month</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Freedom Clock</span>
                <div className="flex items-center gap-2">
                  <FreedomClock initialSeconds={freedomSeconds} variant="COMPACT" />
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={cn(
                "px-4 py-2 border rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                isPrivacyMode 
                  ? "bg-[#F27D26]/10 border-[#F27D26] text-[#F27D26]" 
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              {isPrivacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
              {isPrivacyMode ? 'Privacy On' : 'Privacy Mode'}
            </button>

            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText size={14} />}
              {isExporting ? 'Exporting...' : 'Export Roadmap'}
            </button>

            <button 
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-4 py-2 bg-[#F27D26]/10 border border-[#F27D26] rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#F27D26]/20 transition-colors disabled:opacity-50"
            >
              <Zap className={cn("w-3 h-3 text-[#F27D26]", isSyncing && "animate-spin")} />
              {isSyncing ? 'Syncing All...' : 'Sync All (Open Finance)'}
            </button>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              Live Market Data
            </div>
            <button 
              onClick={() => setView('LEADERBOARD')}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors"
            >
              <Trophy size={14} className="text-[#F27D26]" />
              Leaderboard
            </button>
            <button 
              onClick={() => setView('SECURITY')}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors"
            >
              <Shield size={14} className="text-[#F27D26]" />
              Security
            </button>

            <button 
              onClick={() => setShowYearInReview(true)}
              className="px-4 py-2 bg-[#F27D26]/10 border border-[#F27D26] rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#F27D26]/20 transition-all"
            >
              <Sparkles size={14} className="text-[#F27D26]" />
              Year in Review
            </button>

            {deferredPrompt && (
              <button 
                onClick={handleInstall}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <Download size={14} className="text-[#F27D26]" />
                Install App
              </button>
            )}

            {/* AI Concierge Toggle */}
            <button 
              onClick={() => setIsConciergeEnabled(!isConciergeEnabled)}
              className={cn(
                "px-4 py-2 border rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                isConciergeEnabled 
                  ? "bg-purple-500/10 border-purple-500 text-purple-500" 
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <Sparkles size={14} />
              {isConciergeEnabled ? 'Concierge Active' : 'Guide Me'}
            </button>
          </div>
        </nav>

        <main className="max-w-[1600px] mx-auto px-8 py-12">
          <AnimatePresence mode="wait">
            {view === 'SECURITY' && (
              <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button onClick={() => setView('APP')} className="mb-8 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-[#F27D26]">
                  <ArrowRight className="rotate-180" size={14} /> Back to App
                </button>
                <SecurityPage />
              </motion.div>
            )}

            {view === 'LEADERBOARD' && (
              <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
                <button onClick={() => setView('APP')} className="mb-8 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-[#F27D26]">
                  <ArrowRight className="rotate-180" size={14} /> Back to App
                </button>
                <Leaderboard />
              </motion.div>
            )}

            {view === 'APP' && (
              <>
            {step === 0 && (
              <motion.section 
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center py-12"
              >
                <div className="space-y-8">
                  <h1 className="text-7xl md:text-8xl font-bold tracking-tighter leading-[0.85] uppercase">
                    Stop Guessing.<br />
                    <span className="text-[#F27D26]">Start Solving.</span>
                  </h1>
                  <p className="max-w-xl text-lg opacity-60">
                    The only AI strategist that uses deterministic math to compare your high-interest debt against market ROI. No hallucinations. Just ROI.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="bg-[#F27D26] text-black px-8 py-4 font-bold text-lg rounded-sm hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      BEGIN THE INTERROGATION <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Instant Interest Killer Tool */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-sm space-y-8 backdrop-blur-md relative group">
                  <div className="absolute -top-4 -right-4 bg-[#F27D26] text-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest animate-bounce">
                    Lead Magnet
                  </div>
                  <div>
                    <span className="text-[#F27D26] font-mono text-xs tracking-widest uppercase">Tool: Interest Killer</span>
                    <h2 className="text-3xl font-bold tracking-tight mt-2 italic serif">The Lazy Interest Trap.</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="border-l-2 border-[#F27D26] pl-6 py-2">
                      <label className="block text-xs uppercase tracking-widest opacity-40 mb-2">Total Debt Amount (₹)</label>
                      <input 
                        type="number" 
                        value={hookDebt}
                        onChange={(e) => setHookDebt(Number(e.target.value))}
                        className="bg-transparent border-b border-white/20 w-full py-2 text-3xl font-mono focus:outline-none focus:border-[#F27D26] transition-colors"
                      />
                    </div>
                    <div className="border-l-2 border-white/10 pl-6 py-2">
                      <label className="block text-xs uppercase tracking-widest opacity-40 mb-2">Interest Rate (APR %)</label>
                      <input 
                        type="number" 
                        value={hookRate}
                        onChange={(e) => setHookRate(Number(e.target.value))}
                        className="bg-transparent border-b border-white/20 w-full py-2 text-3xl font-mono focus:outline-none focus:border-[#F27D26] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2">Projected 10-Year Interest</p>
                    <p className="text-5xl font-bold tracking-tighter text-[#F27D26] animate-pulse">
                      ₹{formatINR(hookDebt * (hookRate / 100) * 10)}
                    </p>
                    <p className="text-xs opacity-60 mt-4 leading-relaxed">
                      You are set to pay this in <span className="text-white font-bold italic">"Lazy Interest"</span> to the bank. Click below to kill it using AI.
                    </p>
                    <button 
                      onClick={() => setStep(1)}
                      className="w-full mt-8 bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center justify-center gap-2"
                    >
                      Kill This Interest <Zap size={16} />
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {step === 1 && (
              <motion.section 
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto py-24"
              >
                <div className="mb-16 text-center">
                  <span className="text-[#F27D26] font-mono text-sm tracking-widest uppercase">Phase 01: Liabilities</span>
                  <h2 className="text-5xl font-bold tracking-tight mt-4 italic serif">The Interrogation.</h2>
                  <p className="opacity-50 mt-4 text-lg">We need the raw numbers. Your data is encrypted and never sold.</p>
                </div>

                <ConversationForm onComplete={(data) => {
                  console.log('Onboarding Data:', data);
                  setOnboardingData(data);
                  if (data.loanType === 'None') {
                    setLoans([]); // Clear mock loans for no-debt users
                    setNetWorthVelocity(8.5); // Initial wealth velocity
                  } else {
                    setLoans([{
                      name: `${data.loanType} Loan`,
                      principal: data.emi * 12 * 5, // Heuristic for demo
                      interestRate: data.rate,
                      emi: data.emi,
                      tenure: 60
                    }]);
                  }
                  setStep(2);
                }} />
              </motion.section>
            )}

            {step === 2 && (
              <motion.section 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-8"
              >
                {auditWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-12 p-4 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center gap-3 text-red-500"
                  >
                    <ShieldAlert size={18} />
                    <p className="text-xs font-bold uppercase tracking-widest">{auditWarning}</p>
                  </motion.div>
                )}
                {isLoading ? (
                  <div className="col-span-12">
                    <DashboardSkeleton />
                  </div>
                ) : (
                  <>
                    {/* Left Column: Command Center */}
                    <div className="col-span-12 lg:col-span-8 space-y-12">
                      {/* Intent-Based Header: Status Hologram */}
                      <StatusHologram 
                        health={netWorthVelocity > 10 ? 'GREEN' : 'YELLOW'}
                        metrics={{
                          interestSaved: 4500,
                          burnRate: 40,
                          wealthVelocity: netWorthVelocity
                        }}
                        onDeepDive={() => setActiveTab('ORACLE')}
                      />

                      {/* AI Concierge Toast */}
                      <AnimatePresence>
                        {conciergeMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-sm flex items-center gap-4 text-purple-300"
                          >
                            <Sparkles className="text-purple-500 shrink-0" size={18} />
                            <p className="text-xs font-medium">{conciergeMessage}</p>
                            <button 
                              onClick={() => setConciergeMessage(null)}
                              className="ml-auto text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100"
                            >
                              Dismiss
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Tabs Navigation */}
                      <div className="flex gap-8 border-b border-white/10 pb-4">
                        <button 
                          onClick={() => setActiveTab('STRATEGY')}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative pb-4",
                            activeTab === 'STRATEGY' ? "text-[#F27D26]" : "opacity-40 hover:opacity-100"
                          )}
                        >
                          Current Strategy
                          {activeTab === 'STRATEGY' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27D26]" />}
                        </button>
                        <button 
                          onClick={() => setActiveTab('GOALS')}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative pb-4",
                            activeTab === 'GOALS' ? "text-[#F27D26]" : "opacity-40 hover:opacity-100"
                          )}
                        >
                          Long-Term Goals
                          {activeTab === 'GOALS' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27D26]" />}
                        </button>
                        <button 
                          onClick={() => setActiveTab('HOUSEHOLD')}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative pb-4",
                            activeTab === 'HOUSEHOLD' ? "text-[#F27D26]" : "opacity-40 hover:opacity-100"
                          )}
                        >
                          Family View
                          {activeTab === 'HOUSEHOLD' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27D26]" />}
                        </button>
                        <button 
                          onClick={() => setActiveTab('ORACLE')}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative pb-4 flex items-center gap-2",
                            activeTab === 'ORACLE' ? "text-[#F27D26]" : "opacity-40 hover:opacity-100"
                          )}
                        >
                          <Sparkles size={10} /> Oracle Engine
                          {activeTab === 'ORACLE' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27D26]" />}
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {activeTab === 'STRATEGY' ? (
                          <motion.div 
                            key="strategy"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-12"
                          >
                            {/* One-Tap Action Cards */}
                            <SmartActions />

                            {/* Portfolio Drift Monitor */}
                            <div className="bg-white/5 border border-white/10 rounded-sm p-6">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                  <RefreshCw size={14} className="text-[#F27D26]" /> Portfolio Drift Monitor
                                </h3>
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-1 rounded-sm",
                                  portfolioDrift.drift > 10 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                )}>
                                  {portfolioDrift.drift > 10 ? 'CRITICAL DRIFT' : 'HEALTHY'}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                  <p className="text-[10px] opacity-40 uppercase tracking-widest mb-1">Current Equity</p>
                                  <p className="text-2xl font-bold">{portfolioDrift.currentEquity}%</p>
                                  <div className="w-full h-1 bg-white/10 rounded-full mt-2">
                                    <div className="h-full bg-[#F27D26]" style={{ width: `${portfolioDrift.currentEquity}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] opacity-40 uppercase tracking-widest mb-1">Target Strategy</p>
                                  <p className="text-2xl font-bold">{portfolioDrift.targetEquity}%</p>
                                  <div className="w-full h-1 bg-white/10 rounded-full mt-2">
                                    <div className="h-full bg-white/40" style={{ width: `${portfolioDrift.targetEquity}%` }} />
                                  </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                  <p className="text-[10px] opacity-40 uppercase tracking-widest mb-1">Drift Detected</p>
                                  <p className={cn("text-2xl font-bold", portfolioDrift.drift > 10 ? "text-red-500" : "text-[#F27D26]")}>
                                    {portfolioDrift.drift > 0 ? '+' : ''}{portfolioDrift.drift}%
                                  </p>
                                </div>
                              </div>
                              {portfolioDrift.drift > 10 && (
                                <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-sm flex items-start gap-4">
                                  <ShieldAlert className="text-red-500 shrink-0" size={16} />
                                  <p className="text-[11px] opacity-80 leading-relaxed">
                                    <span className="font-bold text-red-500 uppercase">Profit Booking Nudge:</span> Nifty is at an all-time high. Your strategy suggests moving ₹{(portfolioDrift.drift / 100 * portfolioDrift.totalAssets).toLocaleString('en-IN')} from Equity to your Home Loan to 'lock in' gains and save ₹{(portfolioDrift.drift / 100 * portfolioDrift.totalAssets * 0.085 * 5).toLocaleString('en-IN')} in future interest.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Middle: The Future (Strategy Visualizer) */}
                            <StrategyVisualizer 
                              income={income} 
                              expenses={expenses} 
                              loans={loans} 
                              recommendedRoi={12} 
                            />

                            {/* Interest Saved Chart */}
                            <InterestSavedChart 
                              data={[
                                { month: 'Jan', saved: 5000 },
                                { month: 'Feb', saved: 12000 },
                                { month: 'Mar', saved: 25000 },
                                { month: 'Apr', saved: 42000 },
                                { month: 'May', saved: 68000 },
                                { month: 'Jun', saved: 95000 },
                              ]}
                            />

                            {/* Scenario Matrix */}
                            <ScenarioMatrix 
                              income={income} 
                              expenses={expenses} 
                              loans={loans} 
                              extraMonthly={extraMonthly} 
                              investmentRoi={12} 
                            />

                            {/* Bottom: Breakdown */}
                            <div className="bg-white/5 border border-white/10 rounded-sm">
                              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-xs font-bold uppercase tracking-widest">Liability Breakdown</h3>
                                <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Edit All</button>
                              </div>
                              <div className="divide-y divide-white/5">
                                {loans.map((loan, i) => (
                                  <LoanRow 
                                    key={i}
                                    name={loan.name} 
                                    apr={loan.interestRate} 
                                    emi={loan.emi} 
                                    priority={loan.interestRate > 12 ? "HIGH" : "MEDIUM"} 
                                    isPrivacyMode={isPrivacyMode}
                                    highlight={highlightedCard === loan.name}
                                    onClose={() => {
                                      triggerCelebration();
                                      setShowConfetti(true);
                                      setTimeout(() => setShowConfetti(false), 5000);
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ) : activeTab === 'GOALS' ? (
                          <motion.div 
                            key="goals"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="bg-white/5 p-8 border border-white/10 rounded-sm space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <Target className="text-[#F27D26]" />
                                  <h3 className="text-sm font-bold uppercase tracking-widest">Active Goals</h3>
                                </div>
                                <div className="space-y-6">
                                  <div className="border-l-2 border-[#F27D26] pl-6 py-2">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="font-bold">Daughter's Education</h4>
                                        <p className="text-[10px] opacity-40 uppercase tracking-widest">Target: ₹25,00,000 by 2032</p>
                                      </div>
                                      <span className="text-[10px] font-bold text-[#F27D26] bg-[#F27D26]/10 px-2 py-1 rounded-sm">HIGH PRIORITY</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-4">
                                      <div className="h-full bg-[#F27D26] w-[15%]" />
                                    </div>
                                    <p className="text-[10px] mt-2 opacity-60">₹3,75,000 saved (15%)</p>
                                  </div>

                                  <div className="border-l-2 border-white/20 pl-6 py-2">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="font-bold">Retirement Corpus</h4>
                                        <p className="text-[10px] opacity-40 uppercase tracking-widest">Target: ₹5,00,00,000 by 2050</p>
                                      </div>
                                      <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-1 rounded-sm">MEDIUM PRIORITY</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-4">
                                      <div className="h-full bg-white/40 w-[2%]" />
                                    </div>
                                    <p className="text-[10px] mt-2 opacity-60">₹10,00,000 saved (2%)</p>
                                  </div>
                                </div>
                                <button className="w-full border border-dashed border-white/20 py-4 hover:border-[#F27D26] hover:text-[#F27D26] transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                  <Plus size={12} /> Add New Goal
                                </button>
                              </div>

                              <div className="bg-white/5 p-8 border border-white/10 rounded-sm space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <CalendarDays className="text-[#F27D26]" />
                                  <h3 className="text-sm font-bold uppercase tracking-widest">Sinking Funds</h3>
                                </div>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-sm">
                                    <div>
                                      <p className="text-xs font-bold">Annual Insurance</p>
                                      <p className="text-[9px] opacity-40 uppercase tracking-widest">Due: Sept 2026</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-bold">₹2,500/mo</p>
                                      <p className="text-[9px] opacity-40 uppercase tracking-widest">Target: ₹30,000</p>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-sm">
                                    <div>
                                      <p className="text-xs font-bold">Diwali Shopping</p>
                                      <p className="text-[9px] opacity-40 uppercase tracking-widest">Due: Nov 2026</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-bold">₹1,500/mo</p>
                                      <p className="text-[9px] opacity-40 uppercase tracking-widest">Target: ₹15,000</p>
                                    </div>
                                  </div>
                                </div>
                                {isOverBudget && (
                                  <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => alert("Self-Healing: Redirecting ₹5,000 from 'Diwali Shopping' to cover your 'Dining' overrun. Debt payoff remains on track.")}
                                    className="w-full bg-[#F27D26]/10 border border-[#F27D26] text-[#F27D26] py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw size={12} /> Heal My Month
                                  </motion.button>
                                )}
                                <p className="text-[10px] opacity-40 italic leading-relaxed">
                                  Sinking funds are mentally "reserved" from your disposable income to ensure your debt payoff strategy is realistic.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ) : activeTab === 'HOUSEHOLD' ? (
                          <motion.div 
                            key="household"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <StatCard label="Family Income" value={formatINR(250000, true, isPrivacyMode)} subtext="Aggregate (2 Members)" isPrivacyMode={isPrivacyMode} />
                              <StatCard label="Family Debt" value={formatINR(6500000, true, isPrivacyMode)} subtext="Aggregate Liabilities" isPrivacyMode={isPrivacyMode} />
                              <StatCard label="Family Debt-Free" value="AUG 2034" subtext="Optimized Timeline" isPrivacyMode={isPrivacyMode} />
                            </div>
                            
                            <div className="bg-white/5 border border-white/10 rounded-sm p-8">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                  <Lock size={14} className="text-[#F27D26]" /> Digital Legacy Vault
                                </h3>
                                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-sm">AES-256 SECURED</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <p className="text-xs opacity-60 leading-relaxed">
                                    Secure your family's future. The Legacy Vault stores encrypted instructions for your nominee, triggered only by your "Dead Man's Switch".
                                  </p>
                                  <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                                    <div className="flex justify-between items-center mb-2">
                                      <p className="text-[10px] font-bold uppercase tracking-widest">Dead Man's Switch</p>
                                      <p className="text-[10px] text-[#F27D26]">30 DAYS</p>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full">
                                      <div className="h-full bg-[#F27D26] w-[10%]" />
                                    </div>
                                    <p className="text-[9px] mt-2 opacity-40">Last check-in: 3 days ago</p>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div className="border-l-2 border-white/10 pl-4 py-1">
                                    <label className="block text-[10px] uppercase tracking-widest opacity-40 mb-1">Nominee Email</label>
                                    <p className="text-sm font-bold">spouse@example.com</p>
                                  </div>
                                  <button className="w-full bg-white/5 border border-white/10 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <ShieldCheck size={12} /> Manage Vault Instructions
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-sm p-8">
                              <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Household Members</h3>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-sm">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#F27D26] flex items-center justify-center text-black font-bold">H</div>
                                    <div>
                                      <p className="font-bold">Harshit (Primary)</p>
                                      <p className="text-[10px] opacity-40 uppercase tracking-widest">Full Access</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-bold">₹1,50,000/mo</p>
                                    <p className="text-[10px] opacity-40 uppercase tracking-widest">Income Share: 60%</p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-sm">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">S</div>
                                    <div>
                                      <p className="font-bold">Spouse (Contributor)</p>
                                      <p className="text-[10px] opacity-40 uppercase tracking-widest">Privacy: Debt Masked</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-bold">₹1,00,000/mo</p>
                                    <p className="text-[10px] opacity-40 uppercase tracking-widest">Income Share: 40%</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="oracle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-white/5 border border-white/10 p-6 rounded-sm flex flex-col items-center justify-center text-center">
                                <p className="text-[10px] opacity-40 uppercase tracking-widest mb-4">Strategy Robustness</p>
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                    <circle 
                                      cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                      strokeDasharray={364}
                                      strokeDashoffset={364 - (364 * confidenceScore) / 100}
                                      className="text-[#F27D26] transition-all duration-1000" 
                                    />
                                  </svg>
                                  <span className="absolute text-2xl font-bold">{confidenceScore}%</span>
                                </div>
                                <p className="text-[10px] mt-4 opacity-60">Monte Carlo Confidence</p>
                              </div>
                              <StatCard label="Worst-Case Net Worth" value={formatINR(1200000, true, isPrivacyMode)} subtext="Inflation @ 8%" isPrivacyMode={isPrivacyMode} />
                              <StatCard label="Best-Case Net Worth" value={formatINR(4500000, true, isPrivacyMode)} subtext="Market @ 14%" isPrivacyMode={isPrivacyMode} />
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-sm p-8">
                              <h3 className="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Flag size={14} className="text-[#F27D26]" /> 
                                Life-Event Simulator
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {LIFE_EVENT_TEMPLATES.map((event) => (
                                  <button 
                                    key={event.id}
                                    onClick={() => {
                                      setConfidenceScore(prev => Math.max(40, prev - 15));
                                      alert(`Event Dropped: ${event.name}. Your strategy confidence has adjusted.`);
                                    }}
                                    className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-sm hover:border-[#F27D26] transition-all text-left"
                                  >
                                    <div>
                                      <p className="text-xs font-bold">{event.name}</p>
                                      <p className="text-[9px] opacity-40 uppercase tracking-widest mt-1">{event.description}</p>
                                    </div>
                                    <Plus size={14} className="opacity-20" />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="bg-[#F27D26]/5 border border-[#F27D26]/20 rounded-sm p-6 flex items-center gap-6">
                              <div className="w-12 h-12 rounded-full bg-[#F27D26]/20 flex items-center justify-center text-[#F27D26]">
                                <Shield size={24} />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold uppercase tracking-widest mb-1">Oracle Insight</h4>
                                <p className="text-xs opacity-60 leading-relaxed">
                                  Your plan has a {confidenceScore}% Confidence Level of succeeding even if the Repo Rate stays high. 
                                  {confidenceScore < 70 && " WARNING: High risk of strategy drift. Consider a 'Hard Pivot' to build liquidity."}
                                </p>
                              </div>
                              {confidenceScore < 70 && (
                                <button className="px-4 py-2 bg-[#F27D26] text-black text-[10px] font-bold uppercase tracking-widest rounded-sm">
                                  Hard Pivot
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Right Column: The Coach */}
                    <div className="col-span-12 lg:col-span-4 space-y-8 h-[calc(100vh-160px)] sticky top-32">
                      <CommunityPulse 
                        percentile={82} 
                        location="Hyderabad" 
                        resilienceScore={82} 
                      />
                      <AdvisoryChat highestLoanName="ICICI Personal Loan" highestLoanRate={14.5} />
                      
                      {/* Top Action Item */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-[#F27D26] text-black rounded-sm shadow-[0_0_30px_rgba(242,125,38,0.3)] relative overflow-hidden group cursor-pointer"
                        onClick={() => {
                          triggerCelebration();
                          alert("Action Executed: ₹4,200 paid to Amex. You just saved 2 days of work!");
                        }}
                      >
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap size={14} fill="black" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Top Action Item</span>
                          </div>
                          <h4 className="text-lg font-bold leading-tight mb-4">Pay ₹4,200 to Amex today to save 2 days of work.</h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                            Execute Now <ArrowUpRight size={12} />
                          </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                          <TrendingUp size={120} />
                        </div>
                      </motion.div>

                      {/* Milestone Card */}
                      <div className="p-6 bg-white/5 border border-white/10 rounded-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <Trophy size={20} className="text-[#F27D26]" />
                          </div>
                          <button className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100">Share Card</button>
                        </div>
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-1">Net Worth Milestone</h4>
                        <p className="text-2xl font-bold tracking-tighter mb-4">₹10,00,000 <span className="text-xs opacity-40 font-normal">ACHIEVED</span></p>
                        <div className="w-full h-1 bg-white/10 rounded-full">
                          <div className="h-full bg-[#F27D26] w-full" />
                        </div>
                        <p className="text-[10px] mt-2 opacity-40 italic">You are in the top 15% of your peer group in Hyderabad.</p>
                      </div>
                    </div>
                  </>
                )}
              </motion.section>
            )}
            </>
            )}
          </AnimatePresence>
        </main>
      </div>

      <footer className="border-t border-white/10 p-12 mt-24 pl-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-[#F27D26] rounded-sm flex items-center justify-center">
                <TrendingUp className="text-black w-4 h-4" />
              </div>
              <span className="font-bold tracking-tighter text-lg uppercase">DEBTSTRATEGIST.AI</span>
            </div>
            <p className="text-xs opacity-40 leading-relaxed max-w-sm">
              LEGAL DISCLAIMER: DebtStrategist.AI provides mathematical analysis based on user-provided data. We are not licensed financial advisors. Past performance is not indicative of future results.
            </p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest mb-4">Resources</h5>
            <ul className="text-sm opacity-50 space-y-2">
              <li><a href="#" className="hover:text-[#F27D26]">Math Engine Docs</a></li>
              <li><a href="#" className="hover:text-[#F27D26]">ROI Methodology</a></li>
              <li><a href="#" className="hover:text-[#F27D26]">Security & Privacy</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest mb-4">Compliance</h5>
            <ul className="text-sm opacity-50 space-y-2">
              <li><a href="#" className="hover:text-[#F27D26]">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#F27D26]">Financial Disclaimer</a></li>
              <li><a href="#" className="hover:text-[#F27D26]">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </footer>
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center bg-[#F27D26]/10 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-32 h-32 bg-[#F27D26] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
              >
                <Flag size={64} className="text-black" />
              </motion.div>
              <h2 className="text-4xl font-bold uppercase tracking-tighter mb-2">DEBT SLAIN</h2>
              <p className="text-xs opacity-60 uppercase tracking-widest">You just killed the interest monster.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showYearInReview && (
          <YearInReview userId="default-user" onClose={() => setShowYearInReview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

import { FinancialDebugger } from './components/debug/FinancialDebugger';
import { runSimulation } from './lib/qa/userSimulator';

// Expose API Key for hidden debugger
if (typeof window !== 'undefined') {
  (window as any).GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  (window as any).runSimulation = runSimulation;
}

export default function App() {
  return (
    <ErrorBoundary>
      <StrategyProvider>
        <DashboardContent />
        <FinancialDebugger />
      </StrategyProvider>
    </ErrorBoundary>
  );
}
