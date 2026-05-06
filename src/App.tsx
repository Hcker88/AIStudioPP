/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
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
import { FinanceProvider, useFinance } from './contexts/FinanceContext';
import { formatINR } from './lib/formatters';
import { cn } from './lib/utils';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { DashboardSkeleton } from './components/ui/Skeleton';

import { LandingPage } from './components/landing/LandingPage';
import { OnboardingSection } from './components/onboarding/OnboardingSection';
import { DashboardSection } from './components/dashboard/DashboardSection';

function DashboardContent() {
  const [step, setStep] = useState(0); // 0: Landing, 1: Interrogation, 2: Dashboard
  const [view, setView] = useState<'APP' | 'SECURITY' | 'LEADERBOARD'>('APP');
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [hookDebt, setHookDebt] = useState<number>(1000000);
  const [hookRate, setHookRate] = useState<number>(12);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  
  const { user, profile, loading, login, logout } = useFinance();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile && step === 0) {
      setStep(2); // Jump straight to Dashboard if user and profile exist
    }
  }, [user, profile, step]);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await login();
      setStep(2);
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setStep(0);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

  if (loading) return <DashboardSkeleton />;

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
              Encrypted Architecture • Standard Security
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
    <div className="min-h-screen bg-[#0a0a0f] text-[#E4E3E0] font-sans selection:bg-[#F27D26]/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#F27D26]/[0.03] to-[#0a0a0f]">
      
      {/* Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full w-20 border-r border-white/8 flex flex-col items-center py-8 gap-8 bg-black/50 backdrop-blur-xl z-50">
        <div className="w-10 h-10 bg-[#F27D26] rounded-lg flex items-center justify-center mb-4">
          <TrendingUp className="text-black w-6 h-6" />
        </div>
        <button className="p-3 text-[#F27D26] bg-[#F27D26]/10 rounded-lg"><LayoutDashboard size={20} /></button>
        <button className="p-3 opacity-40 hover:opacity-100 transition-opacity"><Target size={20} /></button>
        <button className="p-3 opacity-40 hover:opacity-100 transition-opacity"><BarChart3 size={20} /></button>
        <div className="mt-auto">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20"></div>
        </div>
      </div>

      <div className="pl-20">
        {/* Navigation */}
        <nav className="border-b border-white/8 p-6 flex justify-between items-center bg-black/20 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tighter text-xl uppercase">DEBTSTRATEGIST<span className="text-[#F27D26]">.AI</span></span>
            </div>
          </div>
          <div className="flex gap-4">

            <button 
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={cn(
                "px-4 py-2 border rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                isPrivacyMode 
                  ? "bg-[#F27D26]/10 border-[#F27D26] text-[#F27D26]" 
                  : "bg-[#18181f] border-white/8 hover:bg-[#1f1f28]"
              )}
            >
              {isPrivacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
              {isPrivacyMode ? 'Privacy On' : 'Privacy Mode'}
            </button>

            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-[#18181f] border border-white/8 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#1f1f28] transition-colors disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText size={14} />}
              {isExporting ? 'Exporting...' : 'Export Roadmap'}
            </button>


            <button 
              onClick={() => setView('SECURITY')}
              className="px-4 py-2 bg-[#18181f] border border-white/8 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#1f1f28] transition-colors"
            >
              <Shield size={14} className="text-[#F27D26]" />
              Security
            </button>



            {deferredPrompt && (
              <button 
                onClick={handleInstall}
                className="px-4 py-2 bg-[#18181f] border border-white/8 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#1f1f28] transition-colors"
              >
                <Download size={14} className="text-[#F27D26]" />
                Install App
              </button>
            )}



            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-[#18181f] border border-white/8 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-[#1f1f28] transition-all"
            >
              LOGOUT
            </button>
          </div>
        </nav>

        <main className="max-w-[1600px] mx-auto px-8 py-12">
          <AnimatePresence mode="wait">
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
                    <LandingPage 
                      handleLogin={() => setStep(1)} 
                      loginError={loginError}
                      hookDebt={hookDebt}
                      setHookDebt={setHookDebt}
                      hookRate={hookRate}
                      setHookRate={setHookRate}
                      onNext={() => setStep(1)}
                    />
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
                    <OnboardingSection 
                      onComplete={() => setStep(2)}
                    />
                  </motion.section>
                )}

                {step === 2 && (
                  <motion.section 
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-12 gap-8"
                  >
                    {loading ? (
                      <div className="col-span-12">
                        <DashboardSkeleton />
                      </div>
                    ) : (
                      <DashboardSection 
                        income={profile?.income || 0}
                        loans={profile?.loans?.map((l: number, i: number) => ({ name: `Loan ${i+1}`, principalAmount: l, interestRate: 15, monthlyEmi: l * 0.05 })) || []}
                        isPrivacyMode={isPrivacyMode}
                        highlightedCard={null}
                        user={user}
                        onLoanClose={() => {
                          triggerCelebration();
                          setShowConfetti(true);
                          setTimeout(() => setShowConfetti(false), 5000);
                        }}
                      />
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
              <span className="font-bold tracking-tighter text-lg uppercase">PapaProfit.ai</span>
            </div>
            <p className="text-xs opacity-40 leading-relaxed max-w-sm">
              LEGAL DISCLAIMER= PapaProfit:provides mathematical analysis based on user-provided data. We are not licensed financial advisors. Past performance is not indicative of future results.
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

export default function App() {
  return (
    <ErrorBoundary>
      <FinanceProvider>
        <DashboardContent />
      </FinanceProvider>
    </ErrorBoundary>
  );
}
