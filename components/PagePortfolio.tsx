
import React from 'react';
import { PortfolioItem, MarketData } from '../types';
import { Building2, Wallet, ChevronRight, DollarSign, Briefcase } from 'lucide-react';

interface PagePortfolioProps {
  holdings: PortfolioItem[];
  brokerBalances: Record<string, number>;
  paperFunds: number;
  marketData: MarketData;
}

export const PagePortfolio: React.FC<PagePortfolioProps> = ({ holdings, brokerBalances, paperFunds, marketData }) => {
  const brokers = ['PAPER', ...Object.keys(brokerBalances)];

  const getBrokerTotal = (broker: string) => {
      const brokerHoldings = holdings.filter(h => h.broker === broker);
      const holdingsValue = brokerHoldings.reduce((acc, h) => {
          const price = marketData[h.symbol]?.price || h.avgCost;
          return acc + (price * h.quantity);
      }, 0);
      const cash = broker === 'PAPER' ? paperFunds : (brokerBalances[broker] || 0);
      return { total: holdingsValue + cash, cash, invested: holdingsValue, count: brokerHoldings.length };
  };

  return (
    <div className="p-4 pb-20 animate-fade-in space-y-6">
       <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400"><Briefcase size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Broker Portfolio</h1>
            <p className="text-xs text-slate-400">Balances across connected accounts</p>
          </div>
       </div>

       <div className="space-y-4">
           {brokers.map(broker => {
               const stats = getBrokerTotal(broker);
               return (
                   <div key={broker} className="bg-surface border border-slate-700 rounded-xl p-5 relative overflow-hidden group">
                       <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                               <div className="p-2 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
                                   <Building2 size={18}/>
                               </div>
                               <div>
                                   <h3 className="font-bold text-white text-lg">{broker}</h3>
                                   <p className="text-[10px] text-slate-500 uppercase tracking-wider">Connected</p>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className="text-xs text-slate-400">Total Net Worth</p>
                               <p className="text-xl font-mono font-bold text-white">₹{stats.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3 mb-2">
                           <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                               <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-xs">
                                   <Wallet size={12}/> Cash Balance
                               </div>
                               <div className="font-mono text-white font-bold">₹{stats.cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                           </div>
                           <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                               <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-xs">
                                   <DollarSign size={12}/> Invested
                               </div>
                               <div className="font-mono text-white font-bold">₹{stats.invested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                           </div>
                       </div>

                       <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700/50">
                           <span>{stats.count} Active Positions</span>
                           <span className="flex items-center gap-1 text-blue-400">View Details <ChevronRight size={12}/></span>
                       </div>
                   </div>
               );
           })}
       </div>
    </div>
  );
};
