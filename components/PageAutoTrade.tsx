import React from 'react';
import { Transaction } from '../types';
import { ActivityFeed } from './ActivityFeed';
import { Bot, Power, Zap, PlayCircle, PauseCircle } from 'lucide-react';

interface PageAutoTradeProps {
  activeBots: { [key: string]: boolean };
  onToggleBot: (broker: string) => void;
  transactions: Transaction[];
}

export const PageAutoTrade: React.FC<PageAutoTradeProps> = ({ activeBots, onToggleBot, transactions }) => {
  return (
    <div className="p-4 pb-20 animate-fade-in space-y-6">
       <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400"><Bot size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Auto-Trading</h1>
            <p className="text-xs text-slate-400">Manage algorithmic trading bots</p>
          </div>
       </div>

       {/* Bot Status Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(activeBots).map(([broker, isActive]) => (
            <div key={broker} className={`relative p-4 rounded-xl border transition-all ${isActive ? 'bg-surface border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-slate-900/50 border-slate-800'}`}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white">{broker} Bot</h3>
                    <button 
                      onClick={() => onToggleBot(broker)}
                      className={`p-2 rounded-full transition-colors ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                    >
                      <Power size={18} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    <span className={`text-xs font-mono ${isActive ? 'text-green-400' : 'text-slate-500'}`}>
                        {isActive ? 'RUNNING' : 'STOPPED'}
                    </span>
                </div>
                {isActive && (
                    <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none rounded-xl">
                        <div className="absolute top-[-50%] right-[-50%] w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                    </div>
                )}
            </div>
          ))}
       </div>

       {/* Strategy Summary */}
       <div className="bg-surface border border-slate-700 p-5 rounded-xl">
           <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Zap size={16} className="text-yellow-400"/> Active Strategy</h3>
           <p className="text-xs text-slate-400 leading-relaxed">
               Bots are currently running the <span className="text-white font-bold">"Momentum Breakout v2"</span> strategy. 
               This strategy targets high-volume breakouts on 5-minute candles with RSI confirmation.
           </p>
           <div className="mt-4 flex gap-2">
               <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] text-slate-300 border border-slate-700">RSI &gt; 60</div>
               <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] text-slate-300 border border-slate-700">Vol &gt; 1.5x Avg</div>
               <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] text-slate-300 border border-slate-700">MACD Cross</div>
           </div>
       </div>

       {/* Live Feed */}
       <div>
           <h3 className="text-lg font-bold text-white mb-4">Execution Log</h3>
           <ActivityFeed transactions={transactions} />
       </div>
    </div>
  );
};