
import React, { useState, useMemo } from 'react';
import { CustomScanParameters, MarketData, StockRecommendation, AppSettings } from '../types';
import { Search, Sliders, Activity, Check, Play, Loader2, Sparkles, Filter, TrendingUp, Zap, BarChart3, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { getIdeasWatchlist } from '../services/stockListService';
import { fetchRealStockData } from '../services/marketDataService';
import { StockCard } from './StockCard';

interface PageScanProps {
  marketData: MarketData;
  settings: AppSettings;
  onTrade: (stock: StockRecommendation) => void;
}

export const PageScan: React.FC<PageScanProps> = ({ marketData, settings, onTrade }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<StockRecommendation[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  
  const [params, setParams] = useState<CustomScanParameters>({
    minRsi: 30,
    maxRsi: 70,
    minAdx: 20,
    minRvol: 1.2,
    priceAboveEma9: false,
    priceAboveEma21: false,
    emaCrossover: false,
    bbSqueeze: false,
    bbBreakout: false,
    priceAboveSupertrend: false,
    macdPositive: false,
    volumeSpike: false,
    stochOversold: false,
    stochOverbought: false,
    adxStrongTrend: false
  });

  const watchlist = useMemo(() => getIdeasWatchlist(), []);

  const runScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setResults([]);
    setShowFilters(false);

    const matchResults: StockRecommendation[] = [];
    const batchSize = 8;
    const targets = watchlist.slice(0, 100);

    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      await Promise.all(batch.map(async (symbol) => {
        try {
          const data = await fetchRealStockData(symbol, settings, "15m", "2d");
          if (data) {
            const tech = data.technicals;
            const price = data.price;

            let matches = true;
            
            // Threshold Filters
            if (params.minRsi !== undefined && tech.rsi < params.minRsi) matches = false;
            if (params.maxRsi !== undefined && tech.rsi > params.maxRsi) matches = false;
            if (params.minAdx !== undefined && tech.adx < params.minAdx) matches = false;
            if (params.minRvol !== undefined && tech.rvol < params.minRvol) matches = false;
            
            // Logic Signals
            if (params.priceAboveEma9 && price <= tech.ema.ema9) matches = false;
            if (params.priceAboveEma21 && price <= tech.ema.ema21) matches = false;
            if (params.emaCrossover && tech.ema.ema9 <= tech.ema.ema21) matches = false;
            if (params.priceAboveSupertrend && tech.supertrend.trend !== 'BUY') matches = false;
            if (params.macdPositive && tech.macd.histogram <= 0) matches = false;
            if (params.volumeSpike && tech.rvol < 2.0) matches = false;
            if (params.bbBreakout && price <= tech.bollinger.upper) matches = false;
            if (params.stochOversold && tech.stoch.k >= 20) matches = false;
            if (params.stochOverbought && tech.stoch.k <= 80) matches = false;
            if (params.adxStrongTrend && tech.adx < 25) matches = false;
            if (params.bbSqueeze && (tech.bollinger.upper - tech.bollinger.lower) / tech.bollinger.middle > 0.05) matches = false;
            
            if (matches) {
              matchResults.push({
                symbol,
                name: symbol.split('.')[0],
                type: 'STOCK',
                sector: 'Equity',
                currentPrice: price,
                reason: `Scanner Hit: ${tech.activeSignals.slice(0, 2).join(' + ')}`,
                riskLevel: tech.score > 80 ? 'Low' : 'Medium',
                targetPrice: price * 1.05,
                lotSize: 1,
                score: tech.score,
                timeframe: 'INTRADAY'
              });
            }
          }
        } catch (e) {}
      }));
      setScanProgress(Math.round(((i + batchSize) / targets.length) * 100));
    }

    setResults(matchResults.sort((a, b) => (b.score || 0) - (a.score || 0)));
    setIsScanning(false);
  };

  const toggleParam = (key: keyof CustomScanParameters) => {
    setParams(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const FilterBadge = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex items-center justify-between p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
    >
        {label}
        <div className={`w-4 h-4 rounded flex items-center justify-center ml-2 ${active ? 'text-blue-400' : 'text-slate-700'}`}>
            {active ? <CheckSquare size={14} /> : <Square size={14} />}
        </div>
    </button>
  );

  return (
    <div className="p-4 pb-24 animate-fade-in max-w-lg mx-auto md:max-w-none flex flex-col h-full">
      <div className="shrink-0 mb-6">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400 border border-blue-500/30">
                    <Filter size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Alpha Scanner</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                        <Sparkles size={10} className="text-yellow-400"/> Quantitative Alpha Filtering
                    </p>
                </div>
            </div>
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-all ${showFilters ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'}`}
            >
                <Sliders size={20} />
            </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6 shrink-0 animate-slide-up overflow-y-auto max-h-[60vh] custom-scrollbar">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                <Activity size={14}/> Thresholds
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Min RSI</label>
                    <input 
                        type="number" value={params.minRsi} 
                        onChange={e => setParams({...params, minRsi: parseInt(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Min ADX</label>
                    <input 
                        type="number" value={params.minAdx} 
                        onChange={e => setParams({...params, minAdx: parseInt(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                <Zap size={14}/> Momentum Signals
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <FilterBadge label="Supertrend Buy" active={!!params.priceAboveSupertrend} onClick={() => toggleParam('priceAboveSupertrend')} />
                <FilterBadge label="MACD Bullish" active={!!params.macdPositive} onClick={() => toggleParam('macdPositive')} />
                <FilterBadge label="Vol Spike 2x" active={!!params.volumeSpike} onClick={() => toggleParam('volumeSpike')} />
                <FilterBadge label="EMA 9 > 21" active={!!params.emaCrossover} onClick={() => toggleParam('emaCrossover')} />
                <FilterBadge label="BB Breakout" active={!!params.bbBreakout} onClick={() => toggleParam('bbBreakout')} />
                <FilterBadge label="BB Squeeze" active={!!params.bbSqueeze} onClick={() => toggleParam('bbSqueeze')} />
                <FilterBadge label="Stoch Oversold" active={!!params.stochOversold} onClick={() => toggleParam('stochOversold')} />
                <FilterBadge label="Stoch Overbought" active={!!params.stochOverbought} onClick={() => toggleParam('stochOverbought')} />
                <FilterBadge label="Strong ADX (>25)" active={!!params.adxStrongTrend} onClick={() => toggleParam('adxStrongTrend')} />
                <FilterBadge label="Price > EMA 21" active={!!params.priceAboveEma21} onClick={() => toggleParam('priceAboveEma21')} />
            </div>

            <button 
                onClick={runScan}
                disabled={isScanning}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
                {isScanning ? (
                    <>
                    <Loader2 size={20} className="animate-spin" />
                    Scanning Market ({scanProgress}%)
                    </>
                ) : (
                    <>
                    <Play size={20} fill="currentColor" />
                    EXECUTE PRO SCAN
                    </>
                )}
            </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
        {!showFilters && (
            <button 
                onClick={() => setShowFilters(true)}
                className="w-full mb-4 py-2 border border-slate-800 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-900/50"
            >
                <ChevronDown size={14}/> Adjust Alpha Filters
            </button>
        )}

        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500"/> Scan Results
          </h3>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{results.length} Matches Found</span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(res => (
              <StockCard key={res.symbol} stock={res} marketData={marketData} onTrade={onTrade} />
            ))}
          </div>
        ) : !isScanning && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl text-center px-6">
            <Activity size={32} className="text-slate-800 mb-4" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Scanner Null</p>
            <p className="text-[9px] text-slate-500 uppercase font-bold mt-2 leading-relaxed">No stocks matching your selected technical logic. Loosen filters or check market hours.</p>
          </div>
        )}
      </div>
    </div>
  );
};
