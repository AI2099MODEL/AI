import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { PortfolioHistoryPoint } from '../types';

interface PortfolioChartProps {
  data: PortfolioHistoryPoint[];
  baseline?: number;
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ data, baseline = 0 }) => {
  // If not enough data, show a placeholder
  if (data.length < 2) {
      return (
          <div className="h-64 flex items-center justify-center bg-surface rounded-xl border border-slate-800 text-slate-500">
              Collecting market data...
          </div>
      )
  }

  // Calculate Gradient Offset for Split Coloring (Profit vs Loss)
  const calculateGradientOffset = () => {
    if (baseline <= 0) return 0; // Default blue/neutral if no baseline
    
    const dataMax = Math.max(...data.map((i) => i.value));
    const dataMin = Math.min(...data.map((i) => i.value));
  
    if (dataMax <= baseline) return 0; // All Loss (Below baseline) -> Logic for offset 0 depends on stop definitions
    if (dataMin >= baseline) return 1; // All Profit (Above baseline)
    if (dataMax === dataMin) return 0.5;

    return (dataMax - baseline) / (dataMax - dataMin);
  };
  
  const off = calculateGradientOffset();

  return (
    <div className="h-64 w-full bg-surface rounded-xl border border-slate-800 p-4 shadow-lg relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Portfolio Performance</h3>
        {baseline > 0 && (
            <div className="text-xs text-slate-500 font-mono">
                Base: ₹{baseline.toLocaleString()}
            </div>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={0.3} />
              <stop offset={off} stopColor="#ef4444" stopOpacity={0.3} />
            </linearGradient>
             <linearGradient id="splitColorStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={1} />
              <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="defaultBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="time" hide={true} />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right" 
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
            stroke="#334155"
            width={40}
          />
          <Tooltip
            content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                    const val = payload[0].value as number;
                    const pnl = val - baseline;
                    const pnlPercent = baseline > 0 ? (pnl / baseline) * 100 : 0;
                    return (
                        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                             <div className="text-slate-400 mb-1">{label}</div>
                             <div className="text-white font-bold text-sm mb-1">₹{val.toLocaleString()}</div>
                             {baseline > 0 && (
                                 <div className={`font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                     {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                                 </div>
                             )}
                        </div>
                    );
                }
                return null;
            }}
          />
          {baseline > 0 && (
             <ReferenceLine y={baseline} stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Cost Basis', position: 'insideTopLeft',  fill: '#64748b', fontSize: 10 }} />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={baseline > 0 ? "url(#splitColorStroke)" : "#3b82f6"}
            strokeWidth={2}
            fillOpacity={1}
            fill={baseline > 0 ? "url(#splitColor)" : "url(#defaultBlue)"}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};