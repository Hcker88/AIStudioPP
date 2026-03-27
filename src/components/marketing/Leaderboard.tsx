/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Trophy, Shield, TrendingUp, Users } from 'lucide-react';
import { formatINR } from '../../lib/formatters';

interface LeaderboardEntry {
  rank: number;
  name: string;
  interestSaved: number;
  resilienceScore: number;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "User_Alpha", interestSaved: 1250000, resilienceScore: 98 },
  { rank: 2, name: "User_Beta", interestSaved: 840000, resilienceScore: 95 },
  { rank: 3, name: "User_Gamma", interestSaved: 620000, resilienceScore: 92 },
  { rank: 4, name: "User_Delta", interestSaved: 450000, resilienceScore: 89 },
  { rank: 5, name: "User_Epsilon", interestSaved: 310000, resilienceScore: 85 },
];

export function Leaderboard() {
  const totalCommunitySaved = 14500000; // 1.45 Cr

  return (
    <div className="bg-white/5 border border-white/10 rounded-sm p-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[#F27D26] font-mono text-[10px] tracking-widest uppercase">Bharat Benchmark</span>
          <h3 className="text-2xl font-bold tracking-tight mt-1 italic serif">Anonymous Alpha.</h3>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-[#F27D26] justify-end">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Community Impact</span>
          </div>
          <p className="text-xl font-mono font-bold">₹{formatINR(totalCommunitySaved)}</p>
          <p className="text-[9px] opacity-40 uppercase tracking-tighter">Total Interest Saved This Week</p>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_LEADERBOARD.map((entry, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-sm group hover:border-[#F27D26]/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono opacity-30">0{entry.rank}</span>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase">{entry.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield size={10} className="text-[#F27D26]" />
                  <span className="text-[9px] opacity-50 uppercase">Resilience: {entry.resilienceScore}%</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono font-bold text-[#F27D26]">₹{formatINR(entry.interestSaved)}</p>
              <p className="text-[8px] opacity-30 uppercase tracking-tighter">Interest Saved</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10 flex items-center gap-3 opacity-50">
        <TrendingUp size={14} className="text-[#F27D26]" />
        <p className="text-[9px] uppercase tracking-widest leading-relaxed">
          Join the top 5% of Indian households who are outperforming the Repo Rate.
        </p>
      </div>
    </div>
  );
}
