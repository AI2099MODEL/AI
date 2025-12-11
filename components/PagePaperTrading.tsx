import React, { useState } from 'react';
import { PortfolioItem, MarketData, Funds, HoldingAnalysis, Transaction } from '../types';
import { PortfolioTable } from './PortfolioTable';
import { ActivityFeed } from './ActivityFeed';
import { TrendingUp, Wallet, PieChart, Sparkles, RefreshCw, Bot, Power, Zap, Play, Pause } from 'lucide-react';

interface PagePaperTradingProps {
  holdings: PortfolioItem[];
  marketData: MarketData;
  analysisData: Record<string, HoldingAnalysis>;
  onSell: (symbol: string, broker: any) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  funds: Funds;
  // Bot Props
  activeBots: Record<string, boolean>;
  onToggleBot: (broker: string) => void;
  transactions: Transaction[];
}

export const PagePaperTrading: React.FC<PagePaperTradingProps> = ({ 
  holdings, marketData, analysisData, onSell, onAnalyze, isAnalyzing, funds,
  activeBots, onToggleBot, transactions
}) => {
  
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'AUTO_BOT'>('PORTFOLIO');

  // Filter only Paper Holdings
  const paperHoldings = holdings.filter(h => h.broker === 'PAPER');
  
  const currentVal = paperHoldings.reduce((acc, h) => acc + ((marketData[h.symbol]?.price || h.avgCost) * h.quantity), 0);
  const totalCost = paperHoldings.reduce((acc, h) => acc + h.totalCost, 0);
  const totalPnl = currentVal - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  
  const availableCash = funds.stock + funds.mcx + funds.forex + funds.crypto;
  const totalAccountValue = availableCash + currentVal;

  return (
    <div className="p-4 pb-20 animate-fade-in flex flex-col h-full">
       <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400"><Wallet size={24} /></div>
              <div>
                <h1 className="text-2xl font-bold text-white">Paper Trading</h1>
                <p className="text-xs text-slate-400">Virtual Portfolio & Bots</p>
              </div>
           </div>
           
           <div className="flex bg-slate-800 rounded-lg p-1">
               <button 
                  onClick={() => setActiveTab('PORTFOLIO')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'PORTFOLIO' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}
               >
                  Portfolio
               </button>
               <button 
                  onClick={() => setActiveTab('AUTO_BOT')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'AUTO_BOT' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
               >
                  Auto-Bot
               </button>
           </div>
       </div>

        {/* Summary Card (Shared) */}
       <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-2xl border border-indigo-500/20 p-6 shadow-xl relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 p-6 opacity-5"><PieChart size={120}/></div>
            
            <div className="grid grid-cols-2 gap-8 relative z-10">
                <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total P&L</p>
                    <div className={`text-3xl font-mono font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </div>
                    <div className={`text-sm font-bold mt-1 ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pnlPercent.toFixed(2)}% Return
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Account Value</p>
                    <div className="text-2xl font-mono font-bold text-white">
                        ₹{totalAccountValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex justify-end items-center gap-1"><Wallet size={10}/> Cash: ₹{(availableCash/1000).toFixed(1)}k</p>
                </div>
            </div>
       </div>

       {/* Tab Content */}
       {activeTab === 'PORTFOLIO' ? (
           <div className="space-y-4 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Holdings</h3>
                    <button 
                        onClick={onAnalyze} 
                        disabled={isAnalyzing}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isAnalyzing ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>} 
                        AI Analyze
                    </button>
                </div>
                <PortfolioTable 
                    portfolio={paperHoldings} 
                    marketData={marketData} 
                    analysisData={analysisData} 
                    onSell={onSell} 
                />
           </div>
       ) : (
           <div className="space-y-6 animate-slide-up">
               {/* Bot Controls */}
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
                    </div>
                  ))}
               </div>
               
               {/* Activity Log */}
               <div>
                   <h3 className="text-lg font-bold text-white mb-4">Execution Log</h3>
                   <ActivityFeed transactions={transactions} />
               </div>
           </div>
       )}
    </div>
  );
};
