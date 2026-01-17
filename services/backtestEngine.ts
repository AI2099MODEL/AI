
import { Candle, StrategyRules, BacktestResult, BacktestTrade, AppSettings } from "../types";
import { fetchRealStockData } from "./marketDataService";
import { analyzeStockTechnical } from "./technicalAnalysis";

const INITIAL_CAPITAL = 100000;
const FLAT_BROKERAGE = 20;

export const runBacktest = async (
    symbols: string[],
    rules: StrategyRules,
    settings: AppSettings,
    interval: string = "5m",
    range: string = "5d",
    onProgress?: (progress: number) => void
): Promise<BacktestResult> => {
    let currentCapital = INITIAL_CAPITAL;
    const trades: BacktestTrade[] = [];
    const equityCurve: { time: string; value: number }[] = [];
    
    // Track equity per step. Since symbols might have different counts, we'll sync by time roughly.
    // For simplicity in this engine, we process symbols sequentially and aggregate results.
    
    let processed = 0;
    for (const symbol of symbols) {
        const data = await fetchRealStockData(symbol, settings, interval, range);
        if (!data || data.history.length < 50) {
            processed++;
            continue;
        }

        const candles = data.history;
        let position: { entryPrice: number; entryTime: number; quantity: number } | null = null;
        let currentSymbolCapital = INITIAL_CAPITAL / symbols.length;

        // Iterate through candles starting from index 30 to have enough data for technicals
        for (let i = 30; i < candles.length; i++) {
            const historySlice = candles.slice(0, i + 1);
            const currentCandle = candles[i];
            const tech = analyzeStockTechnical(historySlice);
            
            // Exit logic if in position
            if (position) {
                const pnlPercent = ((currentCandle.close - position.entryPrice) / position.entryPrice) * 100;
                const atr = tech.atr || (currentCandle.close * 0.02);
                
                let shouldExit = false;
                let exitReason = "";

                const multiplier = pnlPercent > 3.0 ? rules.atrStopMult * 0.7 : rules.atrStopMult;
                const stopPrice = position.entryPrice - (atr * multiplier);
                const targetPrice = position.entryPrice + (atr * rules.atrTargetMult);

                if (currentCandle.close < stopPrice) {
                    shouldExit = true;
                    exitReason = "Stop Loss (ATR)";
                } else if (currentCandle.close > targetPrice) {
                    shouldExit = true;
                    exitReason = "Take Profit (ATR)";
                } else if (i === candles.length - 1) {
                    shouldExit = true;
                    exitReason = "End of Backtest";
                }

                if (shouldExit) {
                    const proceeds = (currentCandle.close * position.quantity) - FLAT_BROKERAGE;
                    const pnl = proceeds - ((position.entryPrice * position.quantity) + FLAT_BROKERAGE);
                    
                    trades.push({
                        symbol,
                        entryTime: position.entryTime,
                        exitTime: currentCandle.time,
                        entryPrice: position.entryPrice,
                        exitPrice: currentCandle.close,
                        quantity: position.quantity,
                        pnl,
                        pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
                        exitReason
                    });
                    
                    currentCapital += pnl;
                    position = null;
                }
            } 
            // Entry logic
            else {
                // Simplified entry condition based on Strategy Log dashboard logic
                const isStrong = tech.score >= 70;
                const hasTrend = tech.adx > rules.rsiBuyZone; // Reusing rsiBuyZone as ADX threshold for backtest simplicity
                
                if (isStrong && hasTrend) {
                    const budget = currentCapital * 0.1; // Allocate 10% per trade
                    const qty = Math.floor(budget / currentCandle.close);
                    
                    if (qty > 0) {
                        position = {
                            entryPrice: currentCandle.close,
                            entryTime: currentCandle.time,
                            quantity: qty
                        };
                    }
                }
            }

            // Record equity point (simplified - every 10 candles or end)
            if (i % 20 === 0 || i === candles.length - 1) {
                equityCurve.push({
                    time: new Date(currentCandle.time).toLocaleDateString(),
                    value: currentCapital
                });
            }
        }
        
        processed++;
        if (onProgress) onProgress(Math.round((processed / symbols.length) * 100));
    }

    const wins = trades.filter(t => t.pnl > 0).length;
    const totalTrades = trades.length;
    
    // Calculate Drawdown
    let peak = INITIAL_CAPITAL;
    let maxDD = 0;
    equityCurve.forEach(p => {
        if (p.value > peak) peak = p.value;
        const dd = (peak - p.value) / peak;
        if (dd > maxDD) maxDD = dd;
    });

    return {
        totalPnl: currentCapital - INITIAL_CAPITAL,
        winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
        totalTrades,
        maxDrawdown: maxDD * 100,
        trades: trades.sort((a,b) => b.exitTime - a.exitTime),
        equityCurve
    };
};
