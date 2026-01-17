
import React, { useMemo, useEffect, useState } from 'react';
import { StockRecommendation, MarketData, MarketSettings } from '../types';
import { StockCard } from './StockCard';
import { RefreshCw, Zap, Clock, Sparkles, BarChart3, Search, AlertCircle, TrendingUp, LayoutGrid, ChevronRight, Activity, Database } from 'lucide-react';
import { getMarketStatus } from '../services/marketStatusService';
import { getGroupedUniverse } from '../services/stockListService';

interface PageMarketProps {
  recommendations: StockRecommendation[];
  marketData: MarketData;
  onTrade: (stock: StockRecommendation) => void;
  onRefresh: () => void;
  isLoading: boolean;
  enabledMarkets: MarketSettings;
}

export const PageMarket: React.FC<PageMarketProps> = ({
  recommendations,
  marketData,
  onTrade,
  onRefresh,
  isLoading,
}) => {
  const [scanProgress, setScanProgress] = useState(0);
  const marketStatus = getMarketStatus('STOCK');
  const isWeekend = !marketStatus.isOpen && marketStatus.message.includes('Weekend');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setScanProgress(p => (p < 90 ? p + 10 : p));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setScanProgress(0);
    }
  }, [isLoading]);

  const industryGroups = useMemo(() => {
    const mapping = getGroupedUniverse();
    const result: Record<string, StockRecommendation[]> = {};
    
    recommendations.forEach(rec => {
        const industry = Object.entries(mapping).find(([_, stocks]) => stocks.includes(rec.symbol))?.[0] || 'Others';
        if (!result[industry]) result[industry] = [];
        result[industry].push(rec);
    });
    return result;
  }, [recommendations]);

  const industries = useMemo(() => Object.keys(industryGroups).sort(), [industryGroups]);

  useEffect(() => {
      if (isWeekend && industries.length > 0 && !selectedIndustry) {
          setSelectedIndustry(industries[0]);
      }
  }, [isWeekend, industries, selectedIndustry]);

  const filteredRecs = useMemo(() => 
    recommendations.filter(r => (r.score || 0) >= 70 && r.timeframe !== 'INTRADAY'), 
    [recommendations]
  );

  const btstPicks = useMemo(() => filteredRecs.filter(r => r.timeframe === 'BTST').slice(0, 5), [filteredRecs]);
  const weeklyPicks = useMemo(() => filteredRecs.filter(r => r.timeframe === 'WEEKLY').slice(0, 5), [filteredRecs]);

  const hasNoData = !isLoading && recommendations.length === 0;

  return (
    <div className="p-4 pb-24 animate-fade-in max-w-lg mx-auto md:max-w-none">
      <div className="flex justify-between items-start mb-4">
         <div>
             <h1 className="text-3xl font-black text-white italic leading-none uppercase tracking-tighter flex items-center gap-2">
                 {isWeekend ? 'Weekend Explorer' : 'AI Robots'}
                 <Sparkles size={20} className="text-blue-400 animate-pulse" />
             </h1>
             <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2 ${isWeekend ? 'text-amber-500' : 'text-slate-500'}`}>
                 {isWeekend ? <Database size={12} /> : <BarChart3 size={12} className="text-blue-500" />} 
                 {isWeekend ? 'Deep Market Profile Active' : 'Real-Time Engine Active'}
             </p>
         </div>
         <button 
           onClick={onRefresh} 
           disabled={isLoading} 
           className={`p-3 bg-blue-600 rounded-2xl text-white shadow-xl hover:bg-blue-500 transition-all active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
         </button>
      </div>

      {isLoading && (
          <div className="mb-8 animate-fade-in">
              <div className="flex justify-between items-end mb-2">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                      {isWeekend ? 'Building Industry Profile...' : 'Scanning Real NSE Data...'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">{scanProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${scanProgress}%` }}></div>
              </div>
          </div>
      )}

      {isWeekend ? (
          <div className="space-y-6 animate-fade-in">
              {/* Industry Navigation */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {industries.map(industry => (
                      <button 
                        key={industry}
                        onClick={() => setSelectedIndustry(industry)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedIndustry === industry ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                      >
                        <LayoutGrid size={14} />
                        {industry}
                      </button>
                  ))}
              </div>

              {selectedIndustry && (
                  <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                          <h2 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                              {selectedIndustry} <ChevronRight size={16} className="text-slate-600" />
                          </h2>
                          <span className="text-[9px] font-black text-slate-500 uppercase">{industryGroups[selectedIndustry].length} Tickers</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {industryGroups[selectedIndustry].map(stock => {
                              const data = marketData[stock.symbol];
                              // Calculate simple Volume & OI intensity profile for weekend display
                              const volIntensity = data ? Math.min(100, (data.history[data.history.length-1].volume / 100000) * 10) : 0;
                              const score = data?.technicals.score || stock.score || 0;

                              return (
                                  <div key={stock.symbol} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/30 transition-all group shadow-xl">
                                      <div className="flex justify-between items-start mb-3">
                                          <div>
                                              <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase">{stock.symbol.split('.')[0]}</h3>
                                              <p className="text-[10px] text-slate-500 font-bold uppercase">₹{stock.currentPrice.toLocaleString()}</p>
                                          </div>
                                          <div className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${score >= 70 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                              Score: {score}%
                                          </div>
                                      </div>

                                      <div className="space-y-3">
                                          {/* Volume Profile Bar */}
                                          <div>
                                              <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                                  <span>Volume Intensity</span>
                                                  <span className="text-slate-300">{volIntensity.toFixed(0)}%</span>
                                              </div>
                                              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                  <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${volIntensity}%` }}></div>
                                              </div>
                                          </div>

                                          {/* OI Profile Bar (Estimated/Sentiment) */}
                                          <div>
                                              <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                                  <span>OI Build-Up (Est)</span>
                                                  <span className="text-slate-300">{(score * 0.8).toFixed(0)}%</span>
                                              </div>
                                              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                  <div className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" style={{ width: `${score * 0.8}%` }}></div>
                                              </div>
                                          </div>
                                      </div>

                                      <div className="mt-4 flex items-center gap-2 bg-slate-950/50 p-2 rounded-xl border border-white/5">
                                          <Activity size={12} className="text-blue-400" />
                                          <p className="text-[9px] text-slate-400 italic line-clamp-1">{stock.reason}</p>
                                      </div>

                                      <button 
                                        onClick={() => onTrade(stock)}
                                        className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                      >
                                          Analyze Setup
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}
          </div>
      ) : hasNoData ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                  <AlertCircle size={32} className="text-slate-500" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2 uppercase italic tracking-tight">No Active Signals Found</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs uppercase tracking-widest font-black">
                  Current market scan returned zero momentum setups above Score 70. 
                  Try refreshing during NSE market hours (9:15 AM - 3:30 PM).
              </p>
              <button 
                onClick={onRefresh}
                className="mt-6 px-6 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all"
              >
                Scan Universe Again
              </button>
          </div>
      ) : (
          <div className="space-y-12">
            {/* BTST Robot Section */}
            <section className="animate-slide-up">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5">
                            <Clock size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight italic">BTST Robot</h2>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Real Momentum Picks</p>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {btstPicks.map(item => (
                        <StockCard key={`btst-${item.symbol}`} stock={item} marketData={marketData} onTrade={onTrade} />
                    ))}
                    {!isLoading && btstPicks.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-slate-900/30 border border-slate-800 rounded-3xl border-dashed">
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">No BTST Setup Found</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Weekly Robot Section */}
            <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight italic">Weekly Robot</h2>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Swing Strategy</p>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weeklyPicks.map(item => (
                        <StockCard key={`weekly-${item.symbol}`} stock={item} marketData={marketData} onTrade={onTrade} />
                    ))}
                    {!isLoading && weeklyPicks.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-slate-900/30 border border-slate-800 rounded-3xl border-dashed">
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">No Weekly Setup Found</p>
                        </div>
                    )}
                </div>
            </section>
          </div>
      )}
      
      <div className="h-12"></div>
    </div>
  );
};
