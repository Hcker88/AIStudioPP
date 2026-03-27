import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, TrendingUp, Target, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { formatINR } from '../../lib/formatters';
import { cn } from '../../lib/utils';

interface YearInReviewProps {
  userId: string;
  onClose: () => void;
}

export function YearInReview({ userId, onClose }: YearInReviewProps) {
  const [report, setReport] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/annual-report?userId=${userId}`);
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error('Failed to fetch annual report:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [userId]);

  const slides = [
    {
      title: "The Interest You Killed",
      value: report ? formatINR(report.interestKilled) : "₹0",
      description: "That's money back in your pocket, not the bank's vault.",
      icon: <Trophy className="w-12 h-12 text-[#F27D26]" />,
      color: "from-[#F27D26]/20 to-transparent"
    },
    {
      title: "The Goal Progress",
      description: "You're closer to your dreams than you were last year.",
      content: report?.goalProgress.map((g: any, i: number) => (
        <div key={i} className="mb-4">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
            <span>{g.name}</span>
            <span>{Math.round(g.progress)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${g.progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-[#F27D26]"
            />
          </div>
        </div>
      )),
      icon: <Target className="w-12 h-12 text-blue-500" />,
      color: "from-blue-500/20 to-transparent"
    },
    {
      title: "The Resilience Jump",
      value: report ? `+${report.resilienceJump}` : "0",
      description: "Your financial discipline score has significantly improved.",
      icon: <ShieldCheck className="w-12 h-12 text-green-500" />,
      color: "from-green-500/20 to-transparent"
    }
  ];

  if (isLoading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6"
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <X size={24} />
      </button>

      <div className="max-w-md w-full h-[70vh] relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "absolute inset-0 p-8 flex flex-col justify-center bg-gradient-to-b",
              slides[currentSlide].color
            )}
          >
            <div className="mb-8">{slides[currentSlide].icon}</div>
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-[#F27D26] mb-2">{slides[currentSlide].title}</h2>
            {slides[currentSlide].value && (
              <div className="text-6xl font-bold tracking-tighter mb-4 italic serif">{slides[currentSlide].value}</div>
            )}
            <p className="text-lg opacity-60 leading-relaxed mb-8">{slides[currentSlide].description}</p>
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicators */}
        <div className="absolute bottom-8 left-8 right-8 flex gap-2">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                i === currentSlide ? "bg-[#F27D26]" : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-12 flex gap-4">
        <button 
          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 disabled:opacity-20 transition-all"
        >
          <ArrowRight className="rotate-180" size={20} />
        </button>
        <button 
          onClick={() => {
            if (currentSlide === slides.length - 1) {
              onClose();
            } else {
              setCurrentSlide(prev => prev + 1);
            }
          }}
          className="px-8 py-4 bg-[#F27D26] text-black font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all flex items-center gap-3"
        >
          {currentSlide === slides.length - 1 ? 'Finish Story' : 'Next Chapter'}
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
}
