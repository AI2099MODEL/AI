import { StockRecommendation, AppSettings, StockData } from "../types";
import { fetchRealStockData } from "./marketDataService";

const TIMEFRAMES = {
  "INTRADAY": { range: "1d", interval: "5m", label: "Intraday Momentum", targetMult: 1.0 },
  "BTST": { range: "2d", interval: "15m", label: "Buy Today Sell Tomorrow", targetMult: 1.8 },
  "WEEKLY": { range: "60d", interval: "1d", label: "Weekly Swing", targetMult: 5.0 },
  "MONTHLY": { range: "1y", interval: "1d", label: "Monthly Positional", targetMult: 10.0 }
};

export const runTechnicalScan = async (
    stockUniverse: string[], 
    settings: AppSettings
): Promise<StockRecommendation[]> => {
  
  // 1. STAGE ONE: BROAD SCAN (Fastest)
  // Scan 60 stocks using Daily data to find initial trend leaders
  const broadScanLimit = 60; 
  const shuffled = [...stockUniverse].sort(() => 0.5 - Math.random());
  const stageOneSymbols = shuffled.slice(0, broadScanLimit);
  
  const stageOneResults = await Promise.all(stageOneSymbols.map(async (symbol) => {
      const data = await fetchRealStockData(symbol, settings, "1d", "60d");
      // Candidates must show basic strength in broad scan
      if (data && data.technicals.score > 60) {
          return { symbol, data };
      }
      return null;
  }));

  const candidates = stageOneResults.filter(Boolean) as { symbol: string, data: StockData }[];
  
  // 2. STAGE TWO: PARALLEL DEEP SCAN
  // Only deep scan top 20 candidates for refinement to maintain "Super Fast" speed
  const leaders = candidates.sort((a, b) => b.data.technicals.score - a.data.technicals.score).slice(0, 20);
  
  const deepScanPromises = leaders.map(async ({ symbol, data: dailyData }) => {
      // Parallel fetch of intraday and shorter timeframe data for candidates
      const [intradayData, btstData] = await Promise.all([
          fetchRealStockData(symbol, settings, "5m", "1d"),
          fetchRealStockData(symbol, settings, "15m", "2d")
      ]);

      return {
          symbol,
          daily: dailyData,
          intraday: intradayData,
          btst: btstData
      };
  });

  const allDataPoints = await Promise.all(deepScanPromises);
  const finalResults: StockRecommendation[] = [];
  const seenSymbols = new Set<string>();

  // Helper to map timeframe signals
  const mapToRecommendation = (symbol: string, data: StockData, timeframe: keyof typeof TIMEFRAMES): StockRecommendation => {
      const score = data.technicals.score;
      const config = TIMEFRAMES[timeframe];
      const atr = data.technicals.atr || (data.price * 0.02);
      
      return {
          symbol,
          name: symbol.split('.')[0],
          type: 'STOCK',
          sector: 'NSE Equity',
          currentPrice: data.price,
          reason: data.technicals.activeSignals.slice(0, 2).join(" | "),
          riskLevel: score > 85 ? 'Low' : 'Medium',
          targetPrice: parseFloat((data.price + (atr * config.targetMult)).toFixed(2)),
          timeframe,
          score,
          lotSize: 1,
          isTopPick: score >= 90
      };
  };

  // 3. STAGE THREE: PEAK ASSIGNMENT & DEDUPLICATION
  // Sort all potential category matches and pick best timeframe for each stock
  const potentialPicks: StockRecommendation[] = [];

  allDataPoints.forEach(dp => {
      // Calculate scores for all 4 horizons
      const scores = {
          'INTRADAY': dp.intraday?.technicals.score || 0,
          'BTST': dp.btst?.technicals.score || 0,
          'WEEKLY': dp.daily.technicals.score,
          'MONTHLY': dp.daily.technicals.score > 85 ? dp.daily.technicals.score : 0 // Monthly only if exceptionally strong
      };

      // Find the best timeframe for this stock
      const bestTimeframe = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0] as keyof typeof TIMEFRAMES;
      const bestScore = scores[bestTimeframe];

      // CRITICAL: Only score > 70 allowed
      if (bestScore > 70) {
          const dataSource = bestTimeframe === 'INTRADAY' ? dp.intraday! : bestTimeframe === 'BTST' ? dp.btst! : dp.daily;
          potentialPicks.push(mapToRecommendation(dp.symbol, dataSource, bestTimeframe));
      }
  });

  // Limit each timeframe to 5 unique stocks
  const timeframeCounts: Record<string, number> = { 'INTRADAY': 0, 'BTST': 0, 'WEEKLY': 0, 'MONTHLY': 0 };
  
  // Sort potential picks globally by score
  potentialPicks.sort((a, b) => (b.score || 0) - (a.score || 0)).forEach(pick => {
      if (timeframeCounts[pick.timeframe!] < 5) {
          finalResults.push(pick);
          timeframeCounts[pick.timeframe!]++;
      }
  });

  return finalResults;
};