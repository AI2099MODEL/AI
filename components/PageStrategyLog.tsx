
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Terminal, Zap, Shield, Activity, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';
import { StrategyRules, StockRecommendation } from '../types';

interface PageStrategyLogProps {
  recommendations: StockRecommendation[];
  rules: StrategyRules;
  onUpdateRules: (rules: StrategyRules) => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  symbol?: string;
}

const DEFAULT_RULES: StrategyRules = {
  rsiBuyZone: 30,
  rsiSellZone: 70,
  vwapConfirm: true,
  minVolMult: 1.5,
  atrStopMult: 1.5,
  atrTargetMult: 3.0,
  maxTradesPerDay: 5
};

export const PageStrategyLog: React.FC<PageStrategyLogProps> = ({ recommendations, rules, onUpdateRules }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [localRules, setLocalRules] = useState<StrategyRules>(rules || DEFAULT_RULES);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate live scanning logs
    const interval = setInterval(() => {
      const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'SBI'];
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const types: LogEntry['type'][] = ['INFO', 'SUCCESS', 'WARNING'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const messages = [
        `Analyzing ${sym} on 5m timeframe...`,
        `Price above VWAP for ${sym}. Confirming signals...`,
        `RSI at ${Math.floor(Math.random() * 40 + 20)} for ${sym}.`,
        `${sym} detected in Momentum Breakout zone.`,
        `OI Spike of ${Math.floor(Math.random() * 15)}% detected for ${sym}.`,
        `Checking ATR-based stop loss for ${sym}.`
      ];

      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message: messages[Math.floor(Math.random() * messages.length)],
        type,
        symbol: sym
      };

      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleRuleChange = (key: keyof StrategyRules, value: any) => {
    const next = { ...localRules, [key]: value };
    setLocalRules(next);
    onUpdateRules(next);
  };

  return (
    <div className="p-4 pb-24 animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400 border border-blue-500/30">
          <Terminal size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight italic uppercase">Strategy Engine</h1>
          <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-widest uppercase">Logic & Threshold Configuration</p>
        </div>
      </div>

      {/* Rules Config Section */}
      <div className="bg-surface border border-slate-700 rounded-2xl p-5 md:p-6 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Settings size={120} />
        </div>
        
        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Zap size={16} /> Signal Thresholds
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-slate-400 font-bold uppercase">RSI Buy Zone (≤)</label>
                <span className="text-xs font-mono text-blue-400">{localRules.rsiBuyZone}</span>
              </div>
              <input 
                type="range" min="10" max="50" step="1" 
                value={localRules.rsiBuyZone} 
                onChange={(e) => handleRuleChange('rsiBuyZone', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-slate-400 font-bold uppercase">Min Volume Multiplier</label>
                <span className="text-xs font-mono text-blue-400">{localRules.minVolMult}x</span>
              </div>
              <input 
                type="range" min="1" max="5" step="0.1" 
                value={localRules.minVolMult} 
                onChange={(e) => handleRuleChange('minVolMult', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-slate-400 font-bold uppercase">ATR Stop Loss Mult</label>
                <span className="text-xs font-mono text-blue-400">{localRules.atrStopMult}x</span>
              </div>
              <input 
                type="range" min="0.5" max="3" step="0.1" 
                value={localRules.atrStopMult} 
                onChange={(e) => handleRuleChange('atrStopMult', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700">
              <label className="text-xs text-slate-400 font-bold uppercase">VWAP Confirmation</label>
              <button 
                onClick={() => handleRuleChange('vwapConfirm', !localRules.vwapConfirm)}
                className={`w-10 h-5 rounded-full relative transition-colors ${localRules.vwapConfirm ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${localRules.vwapConfirm ? 'left-5.5' : 'left-0.5'}`}></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scanning Log Section */}
      <div className="flex flex-col h-[400px]">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity size={16} /> Technical Scanning Log
        </h3>
        <div className="flex-1 bg-black/80 rounded-2xl border border-slate-800 p-4 font-mono text-[10px] md:text-xs overflow-y-auto custom-scrollbar shadow-inner">
          {logs.map(log => (
            <div key={log.id} className="mb-1.5 flex gap-3 animate-fade-in">
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <span className={`shrink-0 font-bold ${
                log.type === 'SUCCESS' ? 'text-green-400' : 
                log.type === 'WARNING' ? 'text-yellow-400' : 
                'text-blue-400'
              }`}>
                {log.type}:
              </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Top 5 Picks Highlight */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Shield size={16} className="text-indigo-400" /> Current AI Top 5 Logic Fired
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {recommendations.slice(0, 5).map((rec, i) => (
            <div key={rec.symbol} className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="text-[10px] font-black text-indigo-400 mb-1">PICK #{i + 1}</div>
              <div className="font-bold text-white text-sm mb-1">{rec.symbol}</div>
              <div className="text-[9px] text-slate-500 line-clamp-1">{rec.reason}</div>
              <div className="mt-2 text-[10px] font-mono font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                SCORE {rec.score?.toFixed(0) || '92'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
