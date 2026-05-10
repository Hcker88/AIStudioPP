import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { UserProfileSchema } from '../../lib/types';

interface ProfileEditModalProps {
  onClose: () => void;
}

export function ProfileEditModal({ onClose }: ProfileEditModalProps) {
  const { profile, updateProfile, refreshProfile } = useFinance();
  const [formData, setFormData] = useState({
    income: profile?.income || 0,
    expenses: profile?.expenses || 0,
    gold: profile?.assets?.gold || 0,
    // Add more fields if needed, but for now just the core ones
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updates: Partial<UserProfileSchema> = {
        income: Number(formData.income),
        expenses: Number(formData.expenses),
        assets: {
          ...profile?.assets,
          gold: Number(formData.gold),
          stocks: profile?.assets?.stocks || []
        }
      };
      await updateProfile(updates);
      await refreshProfile();
      onClose();
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#111116] border border-white/10 rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-[#F27D26]">Edit Financial Profile</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#F27D26]">Monthly Income (₹)</label>
            <input 
              type="number"
              value={formData.income}
              onChange={(e) => setFormData({...formData, income: Number(e.target.value)})}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#F27D26] focus:outline-none transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#F27D26]">Monthly Expenses (₹)</label>
            <input 
              type="number"
              value={formData.expenses}
              onChange={(e) => setFormData({...formData, expenses: Number(e.target.value)})}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#F27D26] focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#F27D26]">Gold Asset Value (₹)</label>
            <input 
              type="number"
              value={formData.gold}
              onChange={(e) => setFormData({...formData, gold: Number(e.target.value)})}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#F27D26] focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors mr-3"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-[#F27D26] text-black px-6 py-2 font-bold rounded-lg hover:bg-orange-400 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
