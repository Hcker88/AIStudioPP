/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConversationFormProps {
  onComplete: (data: any) => void;
}

type StepId = 
  'income' | 'incomeType' | 'expenses' | 'savings' | 'hasLoans' | 'loans' | 'emi' | 
  'hasAssets' | 'stocks' | 'gold' | 'goals' | 'tracks' | 'invests' | 'done';

interface Step {
  id: StepId;
  question: string;
  type: 'NUMBER' | 'CHOICE' | 'TEXT' | 'MESSAGE';
  options?: { label: string; value: string }[];
  condition?: (answers: any) => boolean;
}

const STEPS: Step[] = [
  { id: 'income', question: "What's your monthly income?", type: 'NUMBER' },
  { id: 'incomeType', question: "Is your income fixed or does it change every month?", type: 'CHOICE', options: [{label: 'Fixed', value: 'fixed'}, {label: 'Variable', value: 'variable'}] },
  { id: 'expenses', question: "Roughly how much do you spend monthly?", type: 'NUMBER' },
  { id: 'savings', question: "How much savings do you currently have?", type: 'NUMBER' },
  { id: 'hasLoans', question: "Do you have any loans?", type: 'CHOICE', options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}] },
  { id: 'loans', question: "How much is your total outstanding loan amount?", type: 'NUMBER', condition: (answers) => answers.hasLoans === 'yes' },
  { id: 'emi', question: "How much EMI do you pay monthly?", type: 'NUMBER', condition: (answers) => answers.hasLoans === 'yes' },
  { id: 'hasAssets', question: "Do you invest in stocks or gold?", type: 'CHOICE', options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}] },
  { id: 'stocks', question: "How much do you have invested in stocks/mutual funds?", type: 'NUMBER', condition: (answers) => answers.hasAssets === 'yes' },
  { id: 'gold', question: "How much do you have invested in gold?", type: 'NUMBER', condition: (answers) => answers.hasAssets === 'yes' },
  { id: 'goals', question: "What is your main financial goal right now?", type: 'TEXT' },
  { id: 'tracks', question: "Do you track your expenses regularly?", type: 'CHOICE', options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}] },
  { id: 'invests', question: "Do you invest regularly?", type: 'CHOICE', options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}] },
];

export function ConversationForm({ onComplete }: { onComplete: (data: any) => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeSteps = STEPS.filter((step) => {
    if (step.condition && !step.condition(answers)) return false;
    return true;
  });

  const currentStep = activeSteps[currentStepIndex];
  const historySteps = activeSteps.slice(0, currentStepIndex);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStepIndex, activeSteps.length]);

  const handleNext = () => {
    if (!currentStep) return;

    if (currentStep.type === 'NUMBER' || currentStep.type === 'TEXT') {
      if (!inputValue.trim() && currentStep.type !== 'TEXT') return; 
      
      const val = currentStep.type === 'NUMBER' ? parseFloat(inputValue.replace(/,/g, '')) : inputValue;
      if (currentStep.type === 'NUMBER' && isNaN(val as number)) return;

      setAnswers(prev => ({ ...prev, [currentStep.id]: val }));
    }

    setInputValue('');
    goToNextStep();
  };

  const handleChoice = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentStep.id]: value }));
    goToNextStep();
  };

  const goToNextStep = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      setCurrentStepIndex(curr => curr + 1);
    } else {
      finishOnboarding();
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(curr => curr - 1);
      const prevStep = activeSteps[currentStepIndex - 1];
      if (answers[prevStep.id] !== undefined) {
        setInputValue(answers[prevStep.id].toString());
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  const finishOnboarding = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onComplete({
        income: Number(answers.income) || 0,
        incomeType: answers.incomeType || 'fixed',
        expenses: Number(answers.expenses) || 0,
        savings: Number(answers.savings) || 0,
        loans: answers.hasLoans === 'yes' ? [Number(answers.loans) || 0] : [],
        emi: answers.hasLoans === 'yes' ? (Number(answers.emi) || 0) : 0,
        assets: {
          stocks: answers.hasAssets === 'yes' ? (Number(answers.stocks) || 0) : 0,
          gold: answers.hasAssets === 'yes' ? (Number(answers.gold) || 0) : 0,
        },
        goals: answers.goals ? [{ text: answers.goals, createdAt: Date.now() }] : [],
        habits: {
          tracksExpenses: answers.tracks === 'yes',
          invests: answers.invests === 'yes'
        }
      });
    }, 800);
  };

  if (isSubmitting) {
    return (
      <div className="w-full max-w-2xl mx-auto h-[60vh] flex flex-col items-center justify-center space-y-6">
        <Zap className="text-[#F27D26] w-12 h-12 animate-pulse" />
        <h2 className="text-2xl font-bold italic serif tracking-tight text-white mb-2">Building Your Financial Engine</h2>
        <div className="w-48 overflow-hidden rounded-full bg-white/10 p-1">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: "100%" }} 
            transition={{ duration: 1, ease: "easeInOut" }}
            className="h-1 bg-[#F27D26] rounded-full"
          />
        </div>
      </div>
    );
  }

  const progressPercent = Math.max(5, ((currentStepIndex + 1) / activeSteps.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 lg:p-8 flex flex-col min-h-[70vh]">
      <div className="mb-8 sticky top-0 bg-[#111116] z-10 py-4 border-b border-white/5">
        <div className="flex justify-between items-center mb-3">
           <span className="text-[#F27D26] font-mono text-xs font-bold uppercase tracking-widest">Setup Progress {currentStepIndex + 1}/{activeSteps.length}</span>
           {currentStepIndex > 0 && <button onClick={goBack} className="text-[#F27D26] opacity-70 hover:opacity-100 flex items-center gap-1 text-xs uppercase tracking-widest"><ArrowLeft size={12} /> Back</button>}
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#F27D26]" 
            initial={{ width: `${progressPercent}%` }} 
            animate={{ width: `${progressPercent}%` }} 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pb-32 no-scrollbar pr-4">
        {/* Chat History */}
        <AnimatePresence initial={false}>
          {historySteps.map((step, idx) => (
            <motion.div 
              key={`history-${step.id}`} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Question bubble */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#F27D26]/20 flex items-center justify-center shrink-0 border border-[#F27D26]/30">
                  <span className="text-[#F27D26] text-xs font-bold font-mono">AI</span>
                </div>
                <div className="bg-[#1a1a24] border border-white/5 px-6 py-4 rounded-2xl rounded-tl-sm shadow-md">
                  <p className="text-white/90 font-medium text-lg">{step.question}</p>
                </div>
              </div>

              {/* Answer bubble */}
              <div className="flex items-start gap-4 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <span className="text-white text-xs font-bold font-mono">YOU</span>
                </div>
                <div className="bg-[#F27D26] px-6 py-4 rounded-2xl rounded-tr-sm shadow-md shadow-orange-500/10 text-black">
                  <p className="font-bold text-lg">
                    {step.type === 'CHOICE' 
                      ? step.options?.find(o => o.value === answers[step.id])?.label 
                      : step.type === 'NUMBER' 
                        ? `₹ ${Number(answers[step.id]).toLocaleString('en-IN')}`
                        : answers[step.id]}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Current Question */}
          {currentStep && (
            <motion.div 
              key={`current-${currentStep.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#F27D26] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                  <span className="text-black text-xs font-bold font-mono">AI</span>
                </div>
                <div className="bg-[#1a1a24] border border-[#F27D26]/30 px-6 py-5 rounded-2xl rounded-tl-sm shadow-xl shadow-black/50 w-full max-w-xl">
                  <p className="text-white font-medium text-xl md:text-2xl mb-6">{currentStep.question}</p>
                  
                  {currentStep.type === 'NUMBER' || currentStep.type === 'TEXT' ? (
                    <div className="relative group flex items-center">
                      {currentStep.type === 'NUMBER' && <span className="absolute left-0 text-xl text-[#F27D26] bg-transparent py-4 font-mono pr-2">₹</span>}
                      <input
                        ref={inputRef}
                        type={currentStep.type === 'NUMBER' ? "number" : "text"}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={currentStep.type === 'NUMBER' ? "0" : "Type..."}
                        className={cn(
                          "w-full bg-transparent border-b-2 border-white/20 focus:border-[#F27D26] py-2 text-xl outline-none transition-colors text-white",
                          currentStep.type === 'NUMBER' ? "font-mono pl-6" : "font-medium"
                        )}
                        autoFocus
                      />
                      <button 
                        onClick={handleNext}
                        className="absolute right-0 bottom-3 text-[#F27D26] hover:text-white transition-colors flex items-center gap-2 text-sm font-bold tracking-widest uppercase bg-black/50 px-3 py-1 rounded-sm"
                      >
                        Enter <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {currentStep.options?.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleChoice(opt.value)}
                          className="flex-1 min-w-[120px] bg-black/40 border border-white/20 hover:border-[#F27D26] hover:bg-[#F27D26]/10 text-white font-bold py-3 px-6 rounded-lg transition-all text-center"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {currentStep.type === 'TEXT' && inputValue.trim() === '' && (
                     <p className="text-xs text-white/40 mt-4 text-right cursor-pointer hover:text-white transition-colors" onClick={handleNext}>Skip for now</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} className="h-10" />
      </div>
    </div>
  );
}

