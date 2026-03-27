/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatINR } from '../../lib/formatters';

interface InterestSavedChartProps {
  data: { month: string; saved: number }[];
}

/**
 * Interest Saved Chart: Visualizes the "Debt Monster" shrinking through pre-payments.
 */
export const InterestSavedChart: React.FC<InterestSavedChartProps> = ({ data }) => {
  return (
    <div className="h-[300px] w-full bg-white/5 border border-white/10 rounded-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest">Interest Saved to Date</h3>
          <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">Impact of Pre-payments</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-[#F27D26]">₹{data[data.length - 1]?.saved.toLocaleString('en-IN')}</p>
          <p className="text-[9px] opacity-40 uppercase tracking-widest">Total Interest Killed</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F27D26" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="rgba(255,255,255,0.2)" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.2)" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `₹${value / 1000}K`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
            itemStyle={{ color: '#F27D26', fontSize: '12px' }}
            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px' }}
            formatter={(value: number) => [formatINR(value), 'Interest Saved']}
          />
          <Area 
            type="monotone" 
            dataKey="saved" 
            stroke="#F27D26" 
            fillOpacity={1} 
            fill="url(#colorSaved)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
