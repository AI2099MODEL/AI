import React from 'react';
import { PortfolioItem, MarketData, AssetType, HoldingAnalysis } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Globe, BarChart2, Box, Cpu, Info } from 'lucide-react';

interface PortfolioTableProps {
  portfolio: PortfolioItem[];
  marketData: MarketData;
  analysisData?: Record<string, HoldingAnalysis>;
  onSell: (symbol: string, broker: any) => void;
  showAiInsights?: boolean;
  hideBroker?: boolean;
}

export const PortfolioTable: React.FC<PortfolioTableProps> = ({ 
  portfolio, 
  marketData, 
  analysisData = {}, 
  onSell, 
  showAiInsights = true,
  hideBroker = false
}) => {
  if (portfolio.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-surface rounded-xl border border-slate-800">
        <DollarSign size={48} className="mb-2 opacity-50" />
        <p>No holdings yet. Start trading!</p>
      </div>
    );
  }

  const getAssetIcon = (type: AssetType) => {
      switch(type) {
          case 'MCX': return <Globe size={14} className="text-yellow-400" />;
          case 'FOREX': return <DollarSign size={14} className="text-green-400" />;
          case 'CRYPTO': return <Cpu size={14} className="text-purple-400" />;
          default: return <BarChart2 size={14} className="text-blue-400" />;
      }
  };

  const getBrokerBadge = (broker: string) => {
      let colorClass = 'bg-slate-700 border-slate-600 text-slate-300';
      if (broker === 'DHAN') colorClass = 'bg-purple-900/30 border-purple-700 text-purple-300';
      else if (broker === 'SHOONYA') colorClass = 'bg-orange-900/30 border-orange-700 text-orange-300';
      else if (broker === 'BINANCE') colorClass = 'bg-yellow-900/30 border-yellow-700 text-yellow-300';
      else if (broker === 'COINDCX') colorClass = 'bg-blue-900/30 border-blue-700 text-blue-300';
      else if (broker === 'COINSWITCH') colorClass = 'bg-teal-900/30 border-teal-700 text-teal-300';
      
      return <span className={`text-[10px] px-2 py-0.5 rounded border ${colorClass}`}>{broker}</span>;
  };

  return (
    <div className="overflow-x-auto bg-surface rounded-xl border border-slate-800 shadow-lg custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/50 text-slate-400 text-sm">
            <th className="p-4 font-medium text-center w-20">Action</th>
            <th className="p-4 font-medium">Symbol</th>
            <th className="p-4 font-medium text-center">Type</th>
            {!hideBroker && <th className="p-4 font-medium">Broker</th>}
            <th className="p-4 font-medium text-right">Qty</th>
            <th className="p-4 font-medium text-right">Avg Cost</th>
            <th className="p-4 font-medium text-right">Current</th>
            <th className="p-4 font-medium text-right">P/L</th>
            {showAiInsights && <th className="p-4 font-medium text-center">AI Insight</th>}
          </tr>
        </thead>
        <tbody>
          {portfolio.map((item, idx) => {
            const currentPrice = marketData[item.symbol]?.price || item.avgCost;
            const currentValue = currentPrice * item.quantity;
            const pl = currentValue - item.totalCost;
            const plPercent = item.totalCost > 0 ? (pl / item.totalCost) * 100 : 0;
            const isProfit = pl >= 0;
            
            const analysis = analysisData[item.symbol];

            return (
              <tr key={`${item.symbol}-${item.broker}-${idx}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                <td className="p-4 text-center">
                  <button
                    onClick={() => onSell(item.symbol, item.broker)}
                    className="px-3 py-1.5 text-xs font-bold text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg border border-red-400/20 transition-colors"
                  >
                    SELL
                  </button>
                </td>
                <td className="p-4 font-bold text-white">{item.symbol}</td>
                <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1" title={item.type}>
                        {getAssetIcon(item.type)}
                    </div>
                </td>
                {!hideBroker && (
                    <td className="p-4">
                        {getBrokerBadge(item.broker)}
                    </td>
                )}
                <td className="p-4 text-right text-slate-300 font-mono">{item.quantity.toFixed(item.type === 'CRYPTO' ? 4 : 0)}</td>
                <td className="p-4 text-right text-slate-300 font-mono">₹{item.avgCost.toFixed(2)}</td>
                <td className="p-4 text-right text-slate-300 font-mono">₹{currentPrice.toFixed(2)}</td>
                <td className={`p-4 text-right font-medium font-mono ${isProfit ? 'text-success' : 'text-danger'}`}>
                  <div className="flex flex-col items-end">
                    <span>{pl > 0 ? '+' : ''}{pl.toFixed(2)}</span>
                    <span className="text-xs opacity-75">({plPercent.toFixed(2)}%)</span>
                  </div>
                </td>
                {showAiInsights && (
                    <td className="p-4 text-center">
                    {analysis ? (
                        <div className="group/tooltip relative flex justify-center">
                            <span className={`cursor-help px-2 py-1 rounded text-[10px] font-bold border ${
                                analysis.action === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                analysis.action === 'SELL' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                                {analysis.action}
                            </span>
                            
                            {/* Tooltip */}
                            <div className="absolute right-0 top-8 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 hidden group-hover/tooltip:block text-left animate-fade-in">
                                <div className="text-xs font-bold text-white mb-2 flex items-center gap-1">
                                    <Info size={12}/> AI Analysis
                                </div>
                                <div className="space-y-1 text-[10px] text-slate-300">
                                    <div className="flex justify-between"><span>Target:</span> <span className="font-mono text-white">₹{analysis.targetPrice}</span></div>
                                    <div className="flex justify-between"><span>Dividend:</span> <span className="font-mono text-white">{analysis.dividendYield}</span></div>
                                    <div className="flex justify-between"><span>3Y CAGR:</span> <span className="font-mono text-white">{analysis.cagr}</span></div>
                                    <div className="pt-2 mt-1 border-t border-slate-700 text-slate-400 italic">
                                        "{analysis.reason}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <span className="text-[10px] text-slate-600">-</span>
                    )}
                    </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};