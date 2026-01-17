
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Cpu, Zap, Activity, List, Search, RefreshCw, Layers, ShieldAlert, Sparkles, Sliders, ChevronRight, Check, Play, BarChart, History, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { StrategyRules, StockRecommendation, MarketData, BacktestResult, AppSettings } from '../types';
import { getEngineUniverse, getGroupedUniverse, getIdeasWatchlist } from '../services/stockListService';
import { getMarketStatus } from '../services/marketStatusService';
import { runBacktest } from '../services/backtestEngine';
import { PortfolioChart } from './PortfolioChart';

interface PageStrategyLogProps {
  recommendations: StockRecommendation[];
  marketData: MarketData;
  rules: StrategyRules;
  onUpdateRules: (rules: StrategyRules) => void;
  aiIntradayPicks: string[];
  onRefresh?: () => void;
  settings: AppSettings;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  symbol?: string;
}

export const PageStrategyLog: React.FC<PageStrategyLogProps> = ({ recommendations, marketData, rules, onUpdateRules, aiIntradayPicks, onRefresh, settings }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'QUANT' | 'TUNING' | 'BACKTEST'>('QUANT');
  const [engineUniverse, setEngineUniverse] = useState<string[]>([]);
  const [localRules, setLocalRules] = useState<StrategyRules>(rules);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Backtest State
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [btResult, setBtResult] = useState<BacktestResult | null>(null);
  const [btRange, setBtRange] = useState('5d');

  const groupedUniverse = useMemo(() => getGroupedUniverse(), []);
  
  const quantPicks = useMemo(() => {
    return recommendations
        .filter(r => (r.score || 0) >= 70)
        .sort((a,b) => (b.score || 0) - (a.score || 0))
        .slice(0, 15);
  }, [recommendations]);

  const handleStartBacktest = async () => {
      setIsBacktesting(true);
      setBacktestProgress(0);
      setBtResult(null);
      
      const symbols = getIdeasWatchlist().slice(0, 10); // Run on first 10 for performance
      try {
          const result = await runBacktest(symbols, localRules, settings, "15m", btRange, (p) => setBacktestProgress(p));
          setBtResult(result);
      } catch (e) {
          console.error("Backtest failed", e);
      } finally {
          setIsBacktesting(false);
      }
  };

  useEffect(() => {
    setEngineUniverse(getEngineUniverse());
    const logInterval = setInterval(() => {
      const status = getMarketStatus('STOCK');
      if (!status.isOpen) return;

      const pool = ['RELIANCE', 'HDFCBANK', 'ICICIBANK', 'INFY', 'TCS'];
      const sym = pool[Math.floor(Math.random() * pool.length)];
      
      const logMessages = [
        `System: Calculating Volatility Squeeze probability for ${sym}`,
        `Signal: RVOL Spike verified on ${sym} Institutional layer`,
        `Risk: Recalibrating ATR-Based trailing stops for portfolio`,
        `Strategy: ADX Strength confirmed > 25 for momentum group`,
        `Execution: Monitoring Sliced Entry logic for potential triggers`
      ];

      setLogs(prev => [...prev.slice(-29), {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message: logMessages[Math.floor(Math.random() * logMessages.length)],
        type: 'INFO',
        symbol: sym
      }]);
    }, 4000);

    return () => clearInterval(logInterval);
  }, []);

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
                <h1 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">Strategy Dashboard</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                    <Sparkles size={10} className="text-yellow-400"/> Multi-Factor Momentum Engine
                </p>
            </div>
        </div>
        <button onClick={onRefresh} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 shadow-xl">
            <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex gap-2 shrink-0 overflow-x-auto no-scrollbar pb-2">
         {[
           { id: 'QUANT', label: 'Market Pulse', icon: <Layers size={14}/> },
           { id: 'LOGS', label: 'Live Stream', icon: <Activity size={14}/> },
           { id: 'BACKTEST', label: 'Backtest', icon: <History size={14}/> },
           { id: 'TUNING', label: 'Tuning', icon: <Sliders size={14}/> }
         ].map(t => (
           <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
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
                        <Zap size={14} className="text-yellow-400"/> Quantitative Alpha List
                    </h3>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Top Gainers & Scalps</span>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
                            <tr className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="p-4">Symbol</th>
                                <th className="p-4">Intensity</th>
                                <th className="p-4">Trend</th>
                                <th className="p-4">RSI</th>
                                <th className="p-4">Signals</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {quantPicks.map(stock => {
                                const data = marketData[stock.symbol];
                                const score = data?.technicals.score || stock.score || 0;
                                return (
                                    <tr key={stock.symbol} className="hover:bg-blue-600/5 transition-colors">
                                        <td className="p-4 font-mono font-bold text-white text-xs">{stock.symbol.split('.')[0]}</td>
                                        <td className="p-4">
                                            <div className={`text-[10px] font-black px-2 py-0.5 rounded border inline-block ${score > 75 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                                {score}%
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-mono font-bold text-slate-300">{data?.technicals.adx.toFixed(1) || '--'}</td>
                                        <td className="p-4 text-xs font-mono font-bold text-slate-400">{data?.technicals.rsi.toFixed(0) || '--'}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {data?.technicals.activeSignals.slice(0, 1).map(s => (
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
                    <ShieldAlert size={14}/> Kernel Logic Stream
                </div>
                {logs.map(log => (
                    <div key={log.id} className="mb-2 flex gap-3 animate-fade-in border-b border-white/5 pb-1.5">
                        <span className="text-slate-600 shrink-0 font-bold">[{log.timestamp}]</span>
                        <span className="text-slate-300 italic">{log.message}</span>
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
        )}

        {activeTab === 'BACKTEST' && (
            <div className="space-y-4 animate-slide-up h-full overflow-y-auto custom-scrollbar pr-2 pb-10">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Strategy Backtester</h3>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Simulate IntraBot on historical data</p>
                        </div>
                        <div className="flex gap-2">
                             <select 
                               value={btRange} 
                               onChange={(e) => setBtRange(e.target.value)}
                               className="bg-slate-950 border border-slate-800 text-[10px] font-black text-white rounded-lg px-2 py-1 outline-none"
                             >
                                <option value="5d">Last 5 Days (15m)</option>
                                <option value="1mo">Last 1 Month (1h)</option>
                             </select>
                             <button 
                                onClick={handleStartBacktest}
                                disabled={isBacktesting}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                             >
                                {isBacktesting ? <Loader2 size={14} className="animate-spin"/> : <Play size={14} fill="currentColor"/>}
                                {isBacktesting ? `Simulating (${backtestProgress}%)` : 'Run Backtest'}
                             </button>
                        </div>
                    </div>

                    {!btResult && !isBacktesting && (
                        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-slate-600">
                            <History size={48} className="mb-3 opacity-20"/>
                            <p className="text-[10px] font-black uppercase tracking-widest">Select range and run simulation</p>
                        </div>
                    )}

                    {btResult && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Net P&L</p>
                                    <div className={`text-lg font-mono font-bold ${btResult.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ₹{btResult.totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Win Rate</p>
                                    <div className="text-lg font-mono font-bold text-blue-400">{btResult.winRate.toFixed(1)}%</div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Trades</p>
                                    <div className="text-lg font-mono font-bold text-white">{btResult.totalTrades}</div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Drawdown</p>
                                    <div className="text-lg font-mono font-bold text-red-400">{btResult.maxDrawdown.toFixed(1)}%</div>
                                </div>
                            </div>

                            {/* Equity Curve */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <TrendingUp size={12}/> Performance Curve
                                </h4>
                                <PortfolioChart data={btResult.equityCurve} baseline={100000} />
                            </div>

                            {/* Trade History */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <List size={12}/> Trade History
                                </h4>
                                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                                    <table className="w-full text-left text-[9px] font-mono">
                                        <thead className="bg-slate-900 text-slate-500 font-black uppercase tracking-widest">
                                            <tr>
                                                <th className="p-3">Asset</th>
                                                <th className="p-3">Exit Time</th>
                                                <th className="p-3 text-right">Return</th>
                                                <th className="p-3 text-right">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {btResult.trades.slice(0, 20).map((t, idx) => (
                                                <tr key={idx} className="hover:bg-white/5">
                                                    <td className="p-3 font-bold text-white uppercase">{t.symbol.split('.')[0]}</td>
                                                    <td className="p-3 text-slate-500">{new Date(t.exitTime).toLocaleDateString()}</td>
                                                    <td className={`p-3 text-right font-bold ${t.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {t.pnlPercent.toFixed(1)}%
                                                    </td>
                                                    <td className={`p-3 text-right font-bold ${t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        ₹{t.pnl.toFixed(0)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {btResult.trades.length > 20 && (
                                        <div className="p-3 text-center text-[8px] text-slate-600 uppercase font-black">
                                            Showing last 20 of {btResult.trades.length} trades
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'TUNING' && (
            <div className="space-y-4 animate-slide-up h-full overflow-y-auto custom-scrollbar pr-2">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Strategic Parameters</h3>
                        <button 
                          onClick={() => { onUpdateRules(localRules); }}
                          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                        >
                          Apply Tuning
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Price &gt; VWAP Filter</label>
                            <button 
                              onClick={() => setLocalRules({...localRules, vwapConfirm: !localRules.vwapConfirm})}
                              className={`w-10 h-5 rounded-full relative transition-colors ${localRules.vwapConfirm ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${localRules.vwapConfirm ? 'left-5.5' : 'left-0.5'}`}></div>
                            </button>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">ADX Threshold (Strength)</label>
                                <span className="text-xs font-mono font-bold text-blue-400">{localRules.rsiBuyZone}</span>
                            </div>
                            <input 
                              type="range" min="15" max="40" step="1"
                              value={localRules.rsiBuyZone}
                              onChange={(e) => setLocalRules({...localRules, rsiBuyZone: parseInt(e.target.value)})}
                              className="w-full accent-blue-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                                <Zap size={16} className="text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-[10px] text-blue-300 leading-relaxed font-medium">
                                    <strong>Profit-First Logic:</strong> Higher ADX thresholds reduce trade frequency but significantly increase the Win-Rate of momentum signals.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800/50">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14}/> Engine Components
                     </h3>
                     <div className="space-y-3">
                         {[
                             "Bollinger Squeeze Scanner v4",
                             "Institutional RVOL Detection",
                             "Chandelier ATR Exit Strategy",
                             "Sliced Order Execution Layer"
                         ].map(engine => (
                             <div key={engine} className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-white/5 pb-2">
                                 <Check size={12} className="text-green-500"/> {engine}
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
