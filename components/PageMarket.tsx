import React from 'react';
import { StockRecommendation, MarketData, MarketSettings, AssetType } from '../types';
import { StockCard } from './StockCard';
import { RefreshCw, Globe, TrendingUp, DollarSign, Clock, Calendar, BarChart, Zap, Cpu } from 'lucide-react';

interface PageMarketProps {
  recommendations: StockRecommendation[];
  marketData: MarketData;
  onTrade: (stock: StockRecommendation) => void;
  onRefresh: () => void;
  isLoading: boolean;
  enabledMarkets: MarketSettings;
  allowedTypes?: AssetType[]; // New prop for filtering
}

export const PageMarket: React.FC<PageMarketProps> = ({
  recommendations,
  marketData,
  onTrade,
  onRefresh,
  isLoading,
  enabledMarkets,
  allowedTypes
}) => {
  
  // Helper to check if type is allowed
  const isTypeAllowed = (type: AssetType) => {
    return !allowedTypes || allowedTypes.includes(type);
  };

  // Categorize Stocks
  const intradayRecs = recommendations.filter(r => r.type === 'STOCK' && r.timeframe === 'INTRADAY');
  const btstRecs = recommendations.filter(r => r.type === 'STOCK' && r.timeframe === 'BTST');
  const weeklyRecs = recommendations.filter(r => r.type === 'STOCK' && r.timeframe === 'WEEKLY');
  const monthlyRecs = recommendations.filter(r => r.type === 'STOCK' && r.timeframe === 'MONTHLY');
  const otherStocks = recommendations.filter(r => r.type === 'STOCK' && !['INTRADAY', 'BTST', 'WEEKLY', 'MONTHLY'].includes(r.timeframe || ''));

  const mcxRecs = recommendations.filter(r => r.type === 'MCX');
  const forexRecs = recommendations.filter(r => r.type === 'FOREX');
  const cryptoRecs = recommendations.filter(r => r.type === 'CRYPTO');

  const renderSection = (title: string, items: StockRecommendation[], icon: React.ReactNode, description: string, accentColor: string, type: AssetType) => {
    // Check if this section type allowed by page filter AND enabled in settings
    if (!isTypeAllowed(type)) return null;

    // Settings check: Stock settings cover all stock timeframes
    const settingsKey = type === 'STOCK' ? 'stocks' : type.toLowerCase() as keyof MarketSettings;
    if (!enabledMarkets[settingsKey]) return null;

    if (items.length === 0 && !isLoading) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className={`p-2 bg-slate-800 rounded-lg ${accentColor}`}>{icon}</div>
          <div>
             <h3 className="text-lg font-bold text-white">{title}</h3>
             <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            <div className="h-24 bg-surface rounded-xl border border-slate-800 animate-pulse"></div>
          ) : (
            items.map(item => (
              <StockCard key={item.symbol} stock={item} marketData={marketData} onTrade={onTrade} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 pb-20 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
         <div>
             <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">
                 {allowedTypes && !allowedTypes.includes('STOCK') ? 'F&O / Crypto' : 'Stock Market'}
             </h1>
             <p className="text-xs text-slate-400">AI-Powered Technical Analysis</p>
         </div>
         <button onClick={onRefresh} className={`p-2 bg-blue-600 rounded-full text-white shadow-lg ${isLoading ? 'animate-spin' : ''}`}>
            <RefreshCw size={18} />
         </button>
      </div>

      {isTypeAllowed('STOCK') && (
        <>
            {renderSection("Intraday Fire", intradayRecs, <Zap size={20}/>, "High Momentum Day Trades", "text-orange-400", 'STOCK')}
            {renderSection("BTST Picks", btstRecs, <Clock size={20}/>, "Buy Today, Sell Tomorrow", "text-blue-400", 'STOCK')}
            {renderSection("Weekly Picks", weeklyRecs, <Calendar size={20}/>, "Short Term Holding (5-7 Days)", "text-purple-400", 'STOCK')}
            {renderSection("Monthly Picks", monthlyRecs, <BarChart size={20}/>, "Positional Trades (1 Month+)", "text-green-400", 'STOCK')}
            {renderSection("Other Stocks", otherStocks, <TrendingUp size={20}/>, "Intraday & Momentum", "text-slate-400", 'STOCK')}
        </>
      )}

      {renderSection("Crypto Assets", cryptoRecs, <Cpu size={20}/>, "Digital Currency Signals", "text-purple-400", 'CRYPTO')}
      {renderSection("MCX Commodities", mcxRecs, <Globe size={20}/>, "Futures: Gold, Silver, Crude", "text-yellow-400", 'MCX')}
      {renderSection("Forex Pairs", forexRecs, <DollarSign size={20}/>, "Currency derivatives", "text-teal-400", 'FOREX')}
      
      <div className="h-8"></div>
    </div>
  );
};