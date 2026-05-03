import React from 'react';
import { AlertCircle, ArrowUpRight, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { Insight } from '../../lib/types';
import { cn } from '../../lib/utils';

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-[#18181f] border border-white/8 rounded-xl p-6 relative">
      <span className="absolute top-4 right-4 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-widest font-bold rounded text-[#F27D26]">AI Copilot</span>
      <h3 className="text-xl font-bold mb-4">Financial Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, idx) => {
          let icon = <Info className="w-5 h-5 text-gray-400" />;
          let bg = 'bg-gray-500/10 border-gray-500/20';
          let textColor = 'text-gray-200';
          
          if (insight.priority === 'CRITICAL') {
            icon = <AlertTriangle className="w-5 h-5 text-red-500" />;
            bg = 'bg-red-500/10 border-red-500/20';
            textColor = 'text-red-200';
          } else if (insight.priority === 'HIGH') {
            icon = <AlertCircle className="w-5 h-5 text-orange-500" />;
            bg = 'bg-orange-500/10 border-orange-500/20';
            textColor = 'text-orange-200';
          }

          return (
            <div key={insight.id || idx} className={cn("p-4 border rounded-lg flex items-start gap-4", bg)}>
              <div className="mt-0.5">{icon}</div>
              <div>
                <p className={cn("text-sm leading-relaxed", textColor)}>{insight.content}</p>
                <div className="mt-2 flex gap-2">
                  <span className="text-[10px] uppercase tracking-widest opacity-60">{insight.priority}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
