import { ShieldAlert, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export function StaleDataWarning() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#F27D26]/10 border-b border-[#F27D26]/20 px-6 py-2 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <ShieldAlert size={14} className="text-[#F27D26]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F27D26]">
          Data Stale: Last synced &gt; 24h ago
        </span>
      </div>
      
      <button className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
        <RefreshCw size={12} />
        Sync Now
      </button>
    </motion.div>
  );
}
