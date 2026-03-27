import { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface FeedbackPulseProps {
  userId: string;
  aiResponse: string;
  context: string;
}

export function FeedbackPulse({ userId, aiResponse, context }: FeedbackPulseProps) {
  const [feedback, setFeedback] = useState<'UP' | 'DOWN' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: 'UP' | 'DOWN') => {
    if (feedback) return;
    setFeedback(type);
    setIsSubmitting(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          aiResponse,
          userFeedback: type === 'DOWN' ? 'THUMBS_DOWN' : 'THUMBS_UP',
          context
        })
      });
    } catch (error) {
      console.error('Failed to save feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mt-4 p-3 bg-white/5 border border-white/10 rounded-sm">
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Was this helpful?</span>
      <div className="flex gap-2">
        <button 
          onClick={() => handleFeedback('UP')}
          disabled={isSubmitting || feedback !== null}
          className={cn(
            "p-1.5 rounded-sm transition-all",
            feedback === 'UP' ? "bg-green-500/20 text-green-500" : "hover:bg-white/10 opacity-40 hover:opacity-100"
          )}
        >
          <ThumbsUp size={14} />
        </button>
        <button 
          onClick={() => handleFeedback('DOWN')}
          disabled={isSubmitting || feedback !== null}
          className={cn(
            "p-1.5 rounded-sm transition-all",
            feedback === 'DOWN' ? "bg-red-500/20 text-red-500" : "hover:bg-white/10 opacity-40 hover:opacity-100"
          )}
        >
          <ThumbsDown size={14} />
        </button>
      </div>
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] font-bold text-[#F27D26] uppercase tracking-widest flex items-center gap-1"
          >
            <CheckCircle2 size={10} />
            Feedback Logged
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
