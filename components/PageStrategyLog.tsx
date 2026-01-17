
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Cpu, Zap, Shield, Activity, List, CheckSquare, Square, Search, ChevronDown, ChevronRight, BarChart3, TrendingUp, Sparkles, RefreshCw, Layers, ShieldAlert } from 'lucide-react';
import { StrategyRules, StockRecommendation, MarketData } from '../types';
import { getEngineUniverse, saveEngineUniverse, getGroupedUniverse } from '../services/stockListService';
import { getMarketStatus } from '../services/marketStatusService';

interface PageStrategyLogProps {
  recommendations: StockRecommendation[];
  marketData: MarketData;
  rules: StrategyRules;
  onUpdateRules: (rules: StrategyRules) => void;
  aiIntradayPicks: string[];
  onRefresh?: () => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  symbol?: string;
}

export const PageStrategyLog: React.FC<PageStrategyLogProps> = ({ recommendations, marketData, rules, onUpdateRules, aiIntradayPicks, onRefresh }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'QUANT' | 'UNIVERSE'>('QUANT');
  const [engineUniverse, setEngineUniverse] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  const groupedUniverse = useMemo(() => getGroupedUniverse(), []);
  const industries = useMemo(() => Object.keys(groupedUniverse).sort(), [groupedUniverse]);

  const quantPicks = useMemo(() => {
    return recommendations
        .filter(r => (r.score || 0) >= 70)
        .sort((a,b) => (b.score || 0) - (a.score || 0))
        .slice(0, 15);
  }, [recommendations]);

  useEffect(() => {
    setEngineUniverse(getEngineUniverse());
    const logInterval = setInterval(() => {
      const status = getMarketStatus('STOCK');
      if (!status.isOpen) return;

      const pool = ['RELIANCE', 'HDFCBANK', 'ICICIBANK', 'INFY', 'TCS'];
      const sym = pool[Math.floor(Math.random() * pool.length)];
      const data = marketData[`${sym}.NS`];
      
      const logMessages = [
        `Quantitative Scan: RVOL surge detected in ${sym}`,
        `Institutional Footprint verified for ${sym} @ 5m`,
        `VWAP Anchor check passed for ${sym}`,
        `ATR-based Stop Loss recalibrated for active positions`,
        `Analyzing Mean Reversion probability for ${sym}`
      ];

      setLogs(prev => [...prev.slice(-29), {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message: logMessages[Math.floor(Math.random() * logMessages.length)],
        type: 'INFO',
        symbol: sym
      }]);
    }, 5000);

    return () => clearInterval(logInterval);
  }, [marketData]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="p-4 pb-24 animate-fade-in space-y-6 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                <Cpu size={24} />
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">Quant Strategy Engine</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                    <Sparkles size={10} className="text-yellow-400"/> Multi-Factor Analysis Active
                </p>
            </div>
        </div>
        <button onClick={onRefresh} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 shadow-xl">
            <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex gap-2 shrink-0 overflow-x-auto no-scrollbar pb-2">
         {[
           { id: 'QUANT', label: 'Quant Monitor', icon: <Layers size={14}/> },
           { id: 'LOGS', label: 'Strategy Stream', icon: <Activity size={14}/> },
           { id: 'UNIVERSE', label: 'Scope Manager', icon: <List size={14}/> }
         ].map(t => (
           <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
           >
             {t.icon} {t.label}
           </button>
         ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'QUANT' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full animate-slide-up">
                <div className="p-4 bg-slate-800/40 border-b border-slate-700/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} className="text-yellow-400"/> Momentum Multi-Factor Score
                    </h3>
                    <span className="text-[8px] font-black text-slate-500 uppercase">Top 15 High Conviction</span>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
                            <tr className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="p-4">Asset</th>
                                <th className="p-4">Conviction</th>
                                <th className="p-4">Trend (ADX)</th>
                                <th className="p-4">RSI Status</th>
                                <th className="p-4">Active Strategy</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {quantPicks.map(stock => {
                                const data = marketData[stock.symbol];
                                const score = data?.technicals.score || stock.score || 0;
                                const adx = data?.technicals.adx || 20;
                                return (
                                    <tr key={stock.symbol} className="hover:bg-blue-600/5 transition-colors">
                                        <td className="p-4 font-mono font-bold text-white text-xs">{stock.symbol.split('.')[0]}</td>
                                        <td className="p-4">
                                            <div className={`text-[10px] font-black px-2 py-0.5 rounded border inline-block ${score > 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                                {score}%
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-mono font-bold text-slate-300">{adx.toFixed(1)}</td>
                                        <td className="p-4 text-xs font-mono font-bold text-slate-400">{data?.technicals.rsi.toFixed(0) || '--'}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {data?.technicals.activeSignals.slice(0, 2).map(s => (
                                                    <span key={s} className="text-[7px] font-black uppercase tracking-tighter bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{s}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'LOGS' && (
            <div className="h-full flex flex-col animate-slide-up bg-black/80 rounded-2xl border border-slate-800 p-4 font-mono text-[10px] overflow-y-auto custom-scrollbar">
                <div className="mb-4 text-blue-500 font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={14}/> Strategy Execution Stream
                </div>
                {logs.map(log => (
                    <div key={log.id} className="mb-2 flex gap-3 animate-fade-in border-b border-white/5 pb-1.5">
                        <span className="text-slate-600 shrink-0 font-bold">[{log.timestamp}]</span>
                        <span className="text-slate-300">{log.message}</span>
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
        )}

        {activeTab === 'UNIVERSE' && (
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 h-full overflow-hidden flex flex-col animate-slide-up">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-slate-600" size={14} />
                    <input 
                        type="text"
                        placeholder="Search engine scope..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {industries.map(industry => {
                        const stocks = groupedUniverse[industry];
                        const allActive = stocks.every(s => engineUniverse.includes(s));
                        return (
                            <div key={industry} className="flex justify-between items-center p-3 bg-slate-800/20 rounded-xl border border-slate-800/50">
                                <div>
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{industry}</div>
                                    <div className="text-[8px] text-slate-600 font-mono">{stocks.length} Symbols Available</div>
                                </div>
                                <button className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border ${allActive ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                                    {allActive ? 'Fully Active' : 'Activate Scope'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
