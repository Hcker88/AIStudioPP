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
import { AdvisoryChat } from './components/chat/AdvisoryChat';
import { StrategyProvider, useStrategy } from './contexts/StrategyContext';
import { formatINR } from './lib/formatters';
import { cn } from './lib/utils';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { DashboardSkeleton } from './components/ui/Skeleton';

import { SecurityPage } from './routes/security';
import { ConversationForm } from './components/onboarding/ConversationForm';

function DashboardContent() {
  const [step, setStep] = useState(0); // 0: Landing, 1: Interrogation, 2: Dashboard
  const [view, setView] = useState<'APP' | 'SECURITY' | 'LEADERBOARD'>('APP');
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [hookDebt, setHookDebt] = useState<number>(1000000);
  const [hookRate, setHookRate] = useState<number>(12);
  const [showConfetti, setShowConfetti] = useState(false);
  const { extraMonthly, setLastSyncMessage, isPrivacyMode, setIsPrivacyMode, highlightedCard, setFinancialData } = useStrategy();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading for skeleton
  const [user, setUser] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [loginError, setLoginError] = useState<string | null>(null);

  const fetchUser = async (retryCount = 0) => {
    try {
      console.log("Fetching user..., attempt:", retryCount + 1);
      const response = await fetch('/api/auth/me?t=' + Date.now(), {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (text.includes("Starting Server") && retryCount < 3) {
          console.log("Server is starting, retrying fetchUser in 2 seconds...");
          setTimeout(() => fetchUser(retryCount + 1), 2000);
          return;
        }
        throw new Error(`Server returned an invalid response (not JSON). Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("User data received:", data);
      
      const user = data.data?.user || data.user;
      
      if (user) {
        setUser(user);
        localStorage.setItem('debt_strategist_user', JSON.stringify(user));
        // Do not skip to step 2, let them click "Begin Interrogation"
      } else {
        console.log("No user found in session. Checking localStorage...");
        const storedUser = localStorage.getItem('debt_strategist_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("Using user from localStorage:", parsedUser);
            setUser(parsedUser);
          } catch (e) {
            console.error("Failed to parse stored user", e);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      const storedUser = localStorage.getItem('debt_strategist_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (retryCount = 0) => {
    console.log("handleLogin triggered, attempt:", retryCount + 1);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/url?t=' + Date.now(), {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text.substring(0, 200));
        
        if (text.includes("Starting Server") && retryCount < 3) {
          console.log("Server is starting, retrying in 2 seconds...");
          setLoginError("Server is waking up, retrying...");
          setTimeout(() => handleLogin(retryCount + 1), 2000);
          return;
        }
        
        throw new Error(`Server returned an invalid response (not JSON). Status: ${response.status}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Auth URL fetch failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Auth URL response:", data);
      const url = data.data?.url || data.url;
      if (!url) {
        throw new Error(`No URL returned from server. Response: ${JSON.stringify(data)}`);
      }
      console.log("Opening auth window with URL:", url);
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        setLoginError('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError(error instanceof Error ? error.message : "Login failed. Check console for details.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      localStorage.removeItem('debt_strategist_user');
      setStep(0);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    fetchUser();

    const handleMessage = (event: MessageEvent) => {
      // Security: Always check origin
      if (event.origin !== window.location.origin) {
        return;
      }
      
      console.log("Received message:", event.data);
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log("OAuth success message received, fetching user...");
        if (event.data.user) {
          console.log("Using user data from postMessage:", event.data.user);
          setUser(event.data.user);
          localStorage.setItem('debt_strategist_user', JSON.stringify(event.data.user));
          // Do not skip to step 2, let them click "Begin Interrogation"
          setIsLoading(false);
        } else {
          fetchUser();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const [loans, setLoans] = useState<any[]>([]);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);

  useEffect(() => {
    const totalDebt = loans.reduce((acc, l) => acc + l.principal, 0);
    setFinancialData({ totalDebt, monthlyIncome: income, expenses });
  }, [loans, income, expenses, setFinancialData]);

  useEffect(() => {
    // Simulate initial load for skeleton
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);





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





  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'default-user' }),
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
        body: JSON.stringify({ userId: user?.id || 'default-user' }),
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

  if (isLoading) return <DashboardSkeleton />;

  if (!user && step === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_30%,#3a1510_0%,transparent_60%)]">
        <div className="max-w-2xl w-full text-center space-y-12">
          <div className="space-y-4">
            <h1 className="text-7xl font-bold tracking-tighter italic serif leading-tight">
              Master Your Debt.<br/>
              <span className="text-[#F27D26]">Reclaim Your Freedom.</span>
            </h1>
            <p className="text-xl text-gray-400 font-light max-w-lg mx-auto">
              The AI-powered strategist that turns your debt into a roadmap for wealth.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={() => handleLogin()}
              className="group relative px-12 py-6 bg-white text-black font-bold text-lg rounded-sm hover:scale-105 transition-all flex items-center gap-3"
            >
              <ShieldCheck className="text-[#F27D26]" />
              SECURE LOGIN WITH GOOGLE
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
            {loginError && (
              <div className="text-red-500 bg-red-500/10 p-4 rounded-md border border-red-500/20 max-w-md text-sm">
                {loginError}
              </div>
            )}
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">
              Zero-Knowledge Architecture • Bank-Grade Security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/10">
            <div className="space-y-2">
              <div className="text-xl font-bold italic serif">Smart Routing</div>
              <div className="text-[10px] uppercase tracking-widest opacity-40">Optimize every rupee</div>
            </div>
            <div className="space-y-2">
              <div className="text-xl font-bold italic serif">Stress Testing</div>
              <div className="text-[10px] uppercase tracking-widest opacity-40">Prepare for the worst</div>
            </div>
            <div className="space-y-2">
              <div className="text-xl font-bold italic serif">AI Advisory</div>
              <div className="text-[10px] uppercase tracking-widest opacity-40">Personalized guidance</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E3E0] font-sans selection:bg-[#F27D26] selection:text-black">
      
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
          </div>
          <div className="flex gap-4">

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


            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              Live Market Data
            </div>

            <button 
              onClick={() => setView('SECURITY')}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors"
            >
              <Shield size={14} className="text-[#F27D26]" />
              Security
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



            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              LOGOUT
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
                  setIncome(data.income);
                  setExpenses(data.expenses);
                  
                  if (data.loans && data.loans.length > 0) {
                    setLoans(data.loans.map((l: any) => ({
                      name: l.name,
                      principal: l.principal,
                      interestRate: l.rate,
                      emi: l.emi,
                      tenure: Math.ceil(l.principal / l.emi) || 60
                    })));
                  } else {
                    setLoans([]);
                  }

                  if (data.assets && data.assets.length > 0) {
                    const totalAssets = data.assets.reduce((acc: number, a: any) => acc + a.amount, 0);
                    const equityAssets = data.assets.filter((a: any) => a.type === 'EQUITY').reduce((acc: number, a: any) => acc + a.amount, 0);
                    const currentEquity = totalAssets > 0 ? Math.round((equityAssets / totalAssets) * 100) : 0;
                    const targetEquity = 70; // Default target
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

                {isLoading ? (
                  <div className="col-span-12">
                    <DashboardSkeleton />
                  </div>
                ) : (
                  <>
                    {/* Left Column: Command Center */}
                    <div className="col-span-12 lg:col-span-8 space-y-12">

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label="Monthly Income" value={formatINR(income, true, isPrivacyMode)} isPrivacyMode={isPrivacyMode} />
                        <StatCard label="Total Debt" value={formatINR(loans.reduce((acc, l) => acc + l.principal, 0), true, isPrivacyMode)} isPrivacyMode={isPrivacyMode} />
                        <StatCard label="Monthly EMI" value={formatINR(loans.reduce((acc, l) => acc + l.emi, 0), true, isPrivacyMode)} isPrivacyMode={isPrivacyMode} />
                      </div>

                      {/* Main Content Area */}
                      <div className="space-y-12">
                        {/* Bottom: Breakdown */}
                        <div className="bg-white/5 border border-white/10 rounded-sm">
                          <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest">Liability Breakdown</h3>
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
                      </div>
                    </div>

                    {/* Right Column: The Coach */}
                    <div className="col-span-12 lg:col-span-4 space-y-8 h-[calc(100vh-160px)] sticky top-32">
                      <AdvisoryChat user={user} highestLoanName={loans.length > 0 ? loans.reduce((prev, current) => (prev.interestRate > current.interestRate) ? prev : current).name : "No loans"} highestLoanRate={loans.length > 0 ? loans.reduce((prev, current) => (prev.interestRate > current.interestRate) ? prev : current).interestRate : 0} />
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

    </div>
  );
}

import { FinancialDebugger } from './components/debug/FinancialDebugger';
import { runSimulation } from './lib/qa/userSimulator';

// Expose API Key for hidden debugger
if (typeof window !== 'undefined') {
  (window as any).GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY;
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
