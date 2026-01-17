
import { StockRecommendation, AppSettings, StockData, AssetType } from "../types";
import { fetchRealStockData } from "./marketDataService";
import { getGroupedUniverse } from "./stockListService";
import { getMarketStatus } from "./marketStatusService";
import { GoogleGenAI, Type } from "@google/genai";

async function promisePool<T, R>(
    items: T[],
    batchSize: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    const pool = new Set<Promise<void>>();

    for (const item of items) {
        const promise = fn(item).then((res) => {
            results.push(res);
            pool.delete(promise);
        });
        pool.add(promise);
        if (pool.size >= batchSize) {
            await Promise.race(pool);
        }
    }
    await Promise.all(pool);
    return results;
}

/**
 * runTechnicalScan now detects market status.
 * On weekends, it performs an "Industry Scan" to show a broader perspective.
 */
export const runTechnicalScan = async (
    stockUniverse: string[], 
    settings: AppSettings
): Promise<StockRecommendation[]> => {
  
  const marketStatus = getMarketStatus('STOCK');
  const isWeekend = !marketStatus.isOpen && marketStatus.message.includes('Weekend');

  // On weekends, we scan at least 2 stocks from every industry to populate the explorer
  const scanTargets: string[] = [];
  
  if (isWeekend) {
      const groups = getGroupedUniverse();
      Object.values(groups).forEach(industryStocks => {
          scanTargets.push(...industryStocks.slice(0, 3));
      });
  } else {
      const prioritizedSymbols = stockUniverse.filter(s => s.startsWith('BSE') || s.includes('BANK') || s === 'RELIANCE.NS');
      const others = stockUniverse.filter(s => !prioritizedSymbols.includes(s));
      scanTargets.push(...prioritizedSymbols.slice(0, 20), ...others.sort(() => 0.5 - Math.random()).slice(0, 30));
  }

  const batchResults = await promisePool(scanTargets, 10, async (symbol) => {
      const recommendations: StockRecommendation[] = [];
      const pureSym = symbol.split('.')[0];
      
      try {
          // Fetch data (On weekends, we look at daily charts for "Profile" analysis)
          const interval = isWeekend ? "1d" : "15m";
          const range = isWeekend ? "1mo" : "2d";
          
          const marketData = await fetchRealStockData(symbol, settings, interval, range);

          if (marketData) {
              const tech = marketData.technicals;
              const isHighConviction = tech.score >= 70;
              
              // On weekends, we include stocks even if they aren't >70 score to show industry breadth
              if (isHighConviction || isWeekend) {
                  recommendations.push({
                      symbol,
                      name: pureSym,
                      type: 'STOCK',
                      sector: 'Equity', 
                      currentPrice: marketData.price,
                      reason: tech.activeSignals[0] || "Neutral Range",
                      riskLevel: tech.score > 80 ? 'Low' : tech.score > 50 ? 'Medium' : 'High',
                      targetPrice: marketData.price * (1 + (tech.atr / marketData.price) * 3),
                      timeframe: isWeekend ? 'WEEKLY' : 'BTST',
                      score: tech.score,
                      lotSize: 1,
                      isTopPick: tech.score >= 85
                  });
              }
          }
      } catch (e) { }
      return recommendations;
  });

  const flatResults = batchResults.flat();
  return flatResults.sort((a, b) => (b.score || 0) - (a.score || 0));
};

export const runIntradayAiAnalysis = async (
    recommendations: StockRecommendation[],
    marketData: Record<string, StockData>
): Promise<string[]> => {
    const snapshot = recommendations
        .filter(r => marketData[r.symbol])
        .slice(0, 20)
        .map(r => {
            const d = marketData[r.symbol];
            return {
                symbol: r.symbol,
                price: d.price,
                score: d.technicals.score,
                signals: d.technicals.activeSignals.join(', ')
            };
        });

    if (snapshot.length < 3) return [];

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Analyze these top momentum stocks from the real-time NSE scan. Pick exactly 5 for aggressive day trading continuation. Snapshot: ${JSON.stringify(snapshot)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        top5Symbols: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["top5Symbols"]
                }
            }
        });

        const data = JSON.parse(response.text || '{"top5Symbols": []}');
        return data.top5Symbols || [];
    } catch (e) {
        return recommendations.slice(0, 5).map(r => r.symbol);
    }
};
