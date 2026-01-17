
import { AppSettings, MarketData, PortfolioItem, StockRecommendation, Transaction, Funds } from "../types";

export interface TradeResult {
    executed: boolean;
    transaction?: Transaction;
    newFunds?: Funds;
    newPortfolio?: PortfolioItem[];
    reason?: string;
}

const MAX_GLOBAL_POSITIONS = 8; 
const FLAT_BROKERAGE = 20; 

const getISTTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (5.5 * 60 * 60 * 1000));
};

export const runAutoTradeEngine = (
    settings: AppSettings, 
    portfolio: PortfolioItem[], 
    marketData: MarketData, 
    funds: Funds,
    recommendations: StockRecommendation[]
): TradeResult[] => {
    
    if (!settings.activeBrokers.includes('PAPER')) return [];

    const results: TradeResult[] = [];
    let currentFunds = { ...funds };
    const paperPortfolio = portfolio.filter(p => p.broker === 'PAPER');
    
    const ist = getISTTime();
    const day = ist.getDay();
    const currentMinutes = ist.getHours() * 60 + ist.getMinutes();
    
    if (day === 0 || day === 6) return []; 

    const marketOpen = 9 * 60 + 15;
    const marketClose = 15 * 60 + 30;
    const squareOffTime = 15 * 60 + 20;
    const entryDeadline = 15 * 60 + 0;

    const isMarketOpen = currentMinutes >= marketOpen && currentMinutes < marketClose;
    const isSquareOff = currentMinutes >= squareOffTime;

    // 1. SMART EXIT SYSTEM
    paperPortfolio.forEach(item => {
        const data = marketData[item.symbol];
        if (!data || !isMarketOpen) return;

        const currentPnlPercent = ((data.price - item.avgCost) / item.avgCost) * 100;
        const atr = data.technicals.atr || (data.price * 0.02);
        
        let shouldExit = false;
        let exitReason = "";

        // Strategy A: Chandelier Exit (ATR Trailing)
        // If price drops 1.5x ATR from entry, exit. 
        // If in profit > 3%, trail with 1.0x ATR.
        const multiplier = currentPnlPercent > 3.0 ? 1.0 : 1.5;
        const stopPrice = item.avgCost - (atr * multiplier);
        
        if (data.price < stopPrice) {
            shouldExit = true;
            exitReason = `Volatility Stop (${multiplier}x ATR)`;
        }
        // Strategy B: Time-Based Decay
        else if (currentPnlPercent < 0 && data.technicals.score < 30) {
            shouldExit = true;
            exitReason = "Weakening Momentum Exit";
        }
        // Strategy C: Hard Target Scaling
        else if (currentPnlPercent >= 12.0) {
            shouldExit = true;
            exitReason = "Elite Take-Profit Target";
        }
        // Strategy D: Intraday Close
        else if (item.timeframe === 'INTRADAY' && isSquareOff) {
            shouldExit = true;
            exitReason = "System Square-Off";
        }

        if (shouldExit) {
            const proceeds = (data.price * item.quantity) - FLAT_BROKERAGE;
            currentFunds.stock += proceeds; 
            results.push({
                executed: true,
                transaction: {
                    id: `bot-sell-${Date.now()}-${item.symbol}`,
                    type: 'SELL', symbol: item.symbol, assetType: 'STOCK',
                    quantity: item.quantity, price: data.price, timestamp: Date.now(), 
                    broker: 'PAPER', brokerage: FLAT_BROKERAGE, timeframe: item.timeframe
                },
                newFunds: { ...currentFunds }, 
                reason: exitReason
            });
        }
    });

    // 2. HIGH-ALPHA ENTRY SYSTEM
    if (!isMarketOpen || currentMinutes >= entryDeadline) return results;
    if (paperPortfolio.length >= MAX_GLOBAL_POSITIONS) return results;

    const topCandidates = recommendations
        .filter(r => {
            const data = marketData[r.symbol];
            if (!data) return false;
            
            const isAlreadyHeld = paperPortfolio.some(p => p.symbol === r.symbol);
            const signals = data.technicals.activeSignals;
            
            // WORLD CLASS CRITERIA:
            // 1. Must be Strong Trend (ADX > 25)
            // 2. Must have Volume Pulse (RVOL > 1.5)
            // 3. Must be above EMA 9
            const isStrong = data.technicals.score >= 70;
            const hasVolume = signals.some(s => s.includes("RVOL"));
            const hasTrend = signals.some(s => s.includes("Trend"));

            return isStrong && hasVolume && hasTrend && !isAlreadyHeld;
        })
        .sort((a, b) => (marketData[b.symbol]?.technicals.score || 0) - (marketData[a.symbol]?.technicals.score || 0));

    for (const rec of topCandidates) {
        if (results.some(r => r.transaction?.type === 'BUY')) break;

        const data = marketData[rec.symbol]!;
        const allocation = (settings.autoTradeConfig?.value || 5) / 100;
        const budget = currentFunds.stock * allocation;
        const qty = Math.floor(budget / data.price);

        const cost = (qty * data.price) + FLAT_BROKERAGE;

        if (qty > 0 && currentFunds.stock >= cost) {
            currentFunds.stock -= cost;
            results.push({
                executed: true,
                transaction: {
                    id: `bot-buy-${Date.now()}-${rec.symbol}`,
                    type: 'BUY', symbol: rec.symbol, assetType: 'STOCK',
                    quantity: qty, price: data.price, timestamp: Date.now(), 
                    broker: 'PAPER', brokerage: FLAT_BROKERAGE, timeframe: rec.timeframe || 'INTRADAY'
                },
                newFunds: { ...currentFunds }, 
                reason: `Alpha Entry: ${data.technicals.activeSignals.join(' + ')}`
            });
            break; 
        }
    }

    return results;
};
