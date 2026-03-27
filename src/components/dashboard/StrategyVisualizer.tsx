import { useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import { calculateProjections, Loan } from '@/src/lib/projectionEngine';
import { useStrategy } from '@/src/contexts/StrategyContext';

interface StrategyVisualizerProps {
  income: number;
  expenses: number;
  loans: Loan[];
  recommendedRoi: number;
}

export function StrategyVisualizer({ income, expenses, loans, recommendedRoi }: StrategyVisualizerProps) {
  const { extraMonthly, setExtraMonthly } = useStrategy();

  const data = useMemo(() => {
    return calculateProjections(income, expenses, loans, extraMonthly, recommendedRoi);
  }, [income, expenses, loans, extraMonthly, recommendedRoi]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-sm space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xs font-mono opacity-40 uppercase tracking-widest">Projection Engine</h3>
          <p className="text-3xl font-bold mt-1 italic serif">The Opportunity Cost.</p>
        </div>
        <div className="text-right">
          <label className="block text-[10px] uppercase tracking-widest opacity-40 mb-2">Extra Monthly Contribution</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="0" 
              max="100000" 
              step="1000"
              value={extraMonthly}
              onChange={(e) => setExtraMonthly(Number(e.target.value))}
              className="accent-[#F27D26] w-48 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xl font-bold text-[#F27D26] font-mono w-32">₹{extraMonthly.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F27D26" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke="#ffffff40" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `Year ${val}`}
            />
            <YAxis 
              stroke="#ffffff40" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `₹${val/100000}L`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#050505', border: '1px solid #ffffff20', borderRadius: '4px' }}
              itemStyle={{ fontSize: '12px' }}
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="netWorthB" 
              stroke="#F27D26" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorB)" 
              name="AI Strategy"
              activeDot={{ r: 6, stroke: '#F27D26', strokeWidth: 2, fill: '#050505' }}
            />
            <Area 
              type="monotone" 
              dataKey="netWorthA" 
              stroke="#ffffff20" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="transparent"
              name="Status Quo"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-8 pt-4 border-t border-white/10">
        <div>
          <p className="text-[10px] opacity-30 uppercase tracking-widest mb-1">5 Year Delta</p>
          <p className="text-xl font-bold">+{formatCurrency(data[5].netWorthB - data[5].netWorthA)}</p>
        </div>
        <div>
          <p className="text-[10px] opacity-30 uppercase tracking-widest mb-1">10 Year Delta</p>
          <p className="text-xl font-bold">+{formatCurrency(data[10].netWorthB - data[10].netWorthA)}</p>
        </div>
        <div>
          <p className="text-[10px] opacity-30 uppercase tracking-widest mb-1">20 Year Delta</p>
          <p className="text-xl font-bold text-[#F27D26]">+{formatCurrency(data[20].netWorthB - data[20].netWorthA)}</p>
        </div>
      </div>
    </div>
  );
}
