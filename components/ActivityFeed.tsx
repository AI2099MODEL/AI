import React from 'react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Clock, Zap } from 'lucide-react';

interface ActivityFeedProps {
  transactions: Transaction[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ transactions }) => {
  return (
    <div className="bg-surface rounded-xl border border-slate-800 p-4 shadow-lg h-[400px] overflow-hidden flex flex-col">
      <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
        <Clock size={16} /> Market Activity
        {transactions.length > 0 && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse ml-auto"/>}
      </h3>
      <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
        {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
              <Zap size={24} className="opacity-50"/>
              <span className="text-xs">Waiting for trades...</span>
            </div>
        )}
        {[...transactions].reverse().map((tx) => (
          <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${tx.type === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                {tx.type === 'BUY' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
              </div>
              <div>
                <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    {tx.symbol}
                    <span className="text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-400 font-normal">{tx.broker}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">{tx.type === 'BUY' ? 'Bought' : 'Sold'} <span className="text-slate-300">{tx.quantity}</span> shares</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-slate-300">₹{tx.price.toFixed(2)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{new Date(tx.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};