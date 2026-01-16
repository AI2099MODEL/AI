import { StockRecommendation, AppSettings } from "../types";
import { fetchRealStockData } from "./marketDataService";

const TIMEFRAMES = {
  "BTST": { range: "10d", interval: "15m", label: "1-3 days (BTST)" },
  "INTRADAY": { range: "5d", interval: "15m", label: "Same day" },
  "WEEKLY": { range: "90d", interval: "1d", label: "Up to 1 week" },
  "MONTHLY": { range: "1y", interval: "1d", label: "2-4 weeks" }
};

export const runTechnicalScan = async (
    stockUniverse: string[], 
    settings: AppSettings
): Promise<StockRecommendation[]> => {
  
  const scanLimit = Math.min(stockUniverse.length, 15);
  const symbolsToScan = stockUniverse.slice(0, scanLimit);
  const periods: (keyof typeof TIMEFRAMES)[] = ["BTST", "INTRADAY", "WEEKLY", "MONTHLY"];

  // Parallel processing for all timeframes and symbols to significantly boost speed
  const timeframePromises = periods.map(async (period) => {
    const config = TIMEFRAMES[period];
    
    const symbolResults = await Promise.all(symbolsToScan.map(async (symbol) => {
      try {
        const data = await fetchRealStockData(symbol, settings, config.interval, config.range);
        
        if (data && data.technicals.activeSignals.length >= 2) {
            const tech = data.technicals;
            return {
                symbol: symbol,
                name: symbol.split('.')[0],
                type: 'STOCK' as const,
                sector: 'Momentum Pick',
                currentPrice: data.price,
                reason: tech.activeSignals.join(" | "),
                riskLevel: tech.score > 100 ? 'Low' : tech.score > 70 ? 'Medium' : 'High' as any,
                targetPrice: data.price + (tech.atr * 2),
                lotSize: 1,
                timeframe: period,
                chartPattern: tech.signalStrength,
                score: tech.score,
                isTopPick: tech.score >= 85
            };
        }
      } catch (e) {
        return null;
      }
      return null;
    }));

    return (symbolResults.filter(Boolean) as (StockRecommendation & { score: number })[])
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  });

  const resultsByTimeframe = await Promise.all(timeframePromises);
  const allRecs: StockRecommendation[] = resultsByTimeframe.flat();

  return allRecs;
};