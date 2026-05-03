import React from 'react';
import { PieChart, TrendingUp, Briefcase } from 'lucide-react';
import { InvestmentHolding } from '../../lib/types';
import { formatINR } from '../../lib/formatters';

export function PortfolioCard({ holdings, isPrivacyMode }: { holdings: InvestmentHolding[], isPrivacyMode: boolean }) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="bg-[#18181f] border border-white/8 rounded-xl p-6 text-center text-white/50">
        <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No investment portfolio connected yet.</p>
      </div>
    );
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.buyPrice * h.quantity), 0);
  const pl = totalValue - totalCost;
  const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;

  return (
    <div className="bg-[#18181f] border border-white/8 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-white/8 flex justify-between items-center bg-black/20">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-500" />
          Investment Portfolio
        </h3>
        <div className={`text-sm font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {pl >= 0 ? '+' : ''}{formatINR(pl, true, isPrivacyMode)} ({plPercent.toFixed(2)}%)
        </div>
      </div>
      <div className="p-6 flex flex-col gap-4">
        {holdings.map((h, i) => {
          const value = h.currentPrice * h.quantity;
          return (
            <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
              <div>
                <p className="font-bold">{h.symbol}</p>
                <p className="text-[10px] uppercase tracking-widest opacity-50">{h.assetType}</p>
              </div>
              <div className="text-right">
                <p className="font-mono">{formatINR(value, true, isPrivacyMode)}</p>
                <p className="text-[10px] opacity-50">{h.quantity} units @ {formatINR(h.currentPrice, false, isPrivacyMode)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
