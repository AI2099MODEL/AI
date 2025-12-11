import React from 'react';
import { PortfolioItem, MarketData, Funds, HoldingAnalysis } from '../types';
import { PortfolioTable } from './PortfolioTable';
import { TrendingUp, PieChart, Sparkles, RefreshCw } from 'lucide-react';

interface PageLivePositionsProps {
  holdings: PortfolioItem[];
  marketData: MarketData;
  analysisData: Record<string, HoldingAnalysis>;
  onSell: (symbol: string, broker: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  totalPnl: number;
  totalCapital: number;
}

export const PageLivePositions: React.FC<PageLivePositionsProps> = ({ 
  holdings, marketData, analysisData, onSell, onAnalyze, isAnalyzing, totalPnl, totalCapital
}) => {
  
  const currentVal = holdings.reduce((acc, h) => acc + ((marketData[h.symbol]?.price || h.avgCost) * h.quantity), 0);
  const totalCost = holdings.reduce((acc, h) => acc + h.totalCost, 0);
  const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="p-4 pb-20 animate-fade-in space-y-6">
       <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-green-600/20 rounded-xl text-green-400"><TrendingUp size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Live Positions</h1>
            <p className="text-xs text-slate-400">Real-time P&L tracking</p>
          </div>
       </div>

        {/* Summary Card */}
       <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-xl relative overflow-hidden">
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
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Current Value</p>
                    <div className="text-2xl font-mono font-bold text-white">
                        ₹{currentVal.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Invested: ₹{totalCost.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/50 flex gap-2">
                 <button 
                    onClick={onAnalyze} 
                    disabled={isAnalyzing}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                 >
                    {isAnalyzing ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>} 
                    AI Portfolio Analysis
                 </button>
            </div>
       </div>

       {/* Holdings List */}
       <div>
            <h3 className="text-lg font-bold text-white mb-4">Open Positions ({holdings.length})</h3>
            <PortfolioTable 
                portfolio={holdings} 
                marketData={marketData} 
                analysisData={analysisData} 
                onSell={onSell} 
            />
       </div>
    </div>
  );
};