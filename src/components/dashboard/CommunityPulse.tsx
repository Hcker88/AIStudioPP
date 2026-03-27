/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, MapPin } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface CommunityPulseProps {
  percentile: number;
  location: string;
  resilienceScore: number;
}

/**
 * Community Pulse: A subtle "Percentile" indicator for the dashboard.
 */
export const CommunityPulse: React.FC<CommunityPulseProps> = ({ percentile, location, resilienceScore }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-white/5 border border-white/10 rounded-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#F27D26]" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Bharat Benchmark</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-[#F27D26]">
          <TrendingUp size={12} />
          TOP {100 - percentile}%
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs leading-relaxed">
          Your Resilience Score (<span className="text-[#F27D26] font-bold">{resilienceScore}</span>) is in the top {100 - percentile}% for users in <span className="font-bold">{location}</span> with similar income.
        </p>
        <div className="flex items-center gap-1 text-[9px] opacity-40">
          <MapPin size={10} />
          Location-based Social Proof
        </div>
      </div>

      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentile}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-[#F27D26]"
        />
      </div>
    </motion.div>
  );
};
