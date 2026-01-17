
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Settings, Terminal, Zap, Shield, Activity, BarChart2, CheckCircle2, AlertCircle, Search, List, CheckSquare, Square } from 'lucide-react';
import { StrategyRules, StockRecommendation } from '../types';
import { getFullUniverse, getEngineUniverse, saveEngineUniverse } from '../services/stockListService';

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
  const [activeTab, setActiveTab] = useState<'LOGS' | 'RULES' | 'UNIVERSE'>('LOGS');
  const [engineUniverse, setEngineUniverse] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  const fullUniverse = useMemo(() => getFullUniverse(), []);

  useEffect(() => {
    setEngineUniverse(getEngineUniverse());
    
    // Simulate live scanning logs
    const interval = setInterval(() => {
      const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'SBI'];
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const types: LogEntry['type'][] = ['INFO', 'SUCCESS', 'WARNING'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const messages = [
        `Scanning ${sym} tick stream...`,
        `Analyzing volume profile for ${sym}`,
        `Checking RSI divergence on ${sym}`,
        `${sym} nearing support level`,
        `Detecting OI build-up in ${sym}`
      ];

      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message: messages[Math.floor(Math.random() * messages.length)],
        type,
        symbol: sym
      };

      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, activeTab]);

  const handleToggleStock = (sym: string) => {
    const next = engineUniverse.includes(sym) 
      ? engineUniverse.filter(s => s !== sym)
      : [...engineUniverse, sym];
    setEngineUniverse(next);
    saveEngineUniverse(next);
  };

  const filteredUniverse = useMemo(() => {
    if (!searchTerm) return fullUniverse;
    return fullUniverse.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, fullUniverse]);

  const handleRuleChange = (key: keyof StrategyRules, value: any) => {
    const next = { ...localRules, [key]: value };
    setLocalRules(next);
    onUpdateRules(next);
  };

  return (
    <div className="p-4 pb-24 animate-fade-in space-y-6 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400 border border-blue-500/30">
          <Terminal size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter italic uppercase">Engine Control</h1>
          <p className="text-[10px] md:text-xs text-slate-400 font-black tracking-widest uppercase">Auto-Bot Monitoring & Logic</p>
        </div>
      </div>

      <div className="flex gap-2 shrink-0 overflow-x-auto no-scrollbar pb-2">
         {[
           { id: 'LOGS', label: 'Activity Log', icon: <Activity size={14}/> },
           { id: 'RULES', label: 'Bot Logic', icon: <Zap size={14}/> },
           { id: 'UNIVERSE', label: 'Scan Universe', icon: <List size={14}/> }
         ].map(t => (
           <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500'}`}
           >
             {t.icon} {t.label}
           </button>
         ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'LOGS' && (
            <div className="h-full flex flex-col animate-slide-up">
                <div className="flex-1 bg-black/80 rounded-2xl border border-slate-800 p-4 font-mono text-[10px] md:text-xs overflow-y-auto custom-scrollbar shadow-inner">
                    {logs.map(log => (
                        <div key={log.id} className="mb-1.5 flex gap-3 animate-fade-in">
                            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                            <span className={`shrink-0 font-bold ${log.type === 'SUCCESS' ? 'text-green-400' : log.type === 'WARNING' ? 'text-yellow-400' : 'text-blue-400'}`}>
                                {log.type}:
                            </span>
                            <span className="text-slate-300">{log.message}</span>
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        )}

        {activeTab === 'RULES' && (
            <div className="bg-surface border border-slate-700 rounded-2xl p-6 shadow-2xl animate-slide-up">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Zap size={16} /> Signal Thresholds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">RSI Buy Zone (≤)</label>
                                <span className="text-xs font-mono text-blue-400">{localRules.rsiBuyZone}</span>
                            </div>
                            <input type="range" min="10" max="50" step="1" value={localRules.rsiBuyZone} onChange={(e) => handleRuleChange('rsiBuyZone', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">ATR Stop Mult</label>
                                <span className="text-xs font-mono text-blue-400">{localRules.atrStopMult}x</span>
                            </div>
                            <input type="range" min="0.5" max="3" step="0.1" value={localRules.atrStopMult} onChange={(e) => handleRuleChange('atrStopMult', parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800">
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">VWAP Confirmation</label>
                        <button onClick={() => handleRuleChange('vwapConfirm', !localRules.vwapConfirm)} className={`w-10 h-5 rounded-full relative transition-colors ${localRules.vwapConfirm ? 'bg-blue-600' : 'bg-slate-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${localRules.vwapConfirm ? 'left-5.5' : 'left-0.5'}`}></div>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'UNIVERSE' && (
            <div className="h-full flex flex-col animate-slide-up bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <List size={14}/> Engine Monitoring List
                    </h3>
                </div>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-slate-600" size={14} />
                    <input 
                        type="text"
                        placeholder="Search Engine scan universe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-blue-500 outline-none font-mono"
                    />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {filteredUniverse.map(sym => {
                        const active = engineUniverse.includes(sym);
                        return (
                            <button 
                                key={sym}
                                onClick={() => handleToggleStock(sym)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${active ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900/20 border-slate-800/50 hover:bg-slate-800/50'}`}
                            >
                                <span className={`text-xs font-mono font-bold ${active ? 'text-blue-400' : 'text-slate-500'}`}>{sym}</span>
                                {active ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} className="text-slate-700" />}
                            </button>
                        );
                    })}
                </div>
                <p className="text-[9px] text-slate-600 italic px-2 mt-4">Stocks selected here are monitored by the Auto-Bot for execution signals.</p>
            </div>
        )}
      </div>

      <div className="shrink-0">
        <h3 className="text-[10px] font-black text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
          <Shield size={14} className="text-indigo-400" /> AI Bot Current Focus
        </h3>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {recommendations.slice(0, 5).map((rec, i) => (
            <div key={rec.symbol} className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex flex-col items-center text-center flex-shrink-0 w-32">
              <div className="text-[8px] font-black text-indigo-400 mb-1">UNIT {i + 1}</div>
              <div className="font-bold text-white text-xs mb-1 font-mono">{rec.symbol.split('.')[0]}</div>
              <div className="text-[9px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                {rec.score?.toFixed(0) || '92'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
