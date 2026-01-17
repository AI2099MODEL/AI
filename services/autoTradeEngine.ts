
import { AppSettings, MarketData, PortfolioItem, StockRecommendation, Transaction, Funds } from "../types";

export interface TradeResult {
    executed: boolean;
    transaction?: Transaction;
    newFunds?: Funds;
    newPortfolio?: PortfolioItem[];
    reason?: string;
}

const MAX_GLOBAL_POSITIONS = 10; 
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
    
    if (day === 0 || day === 6) return []; // Weekends Off

    const marketOpen = 9 * 60 + 15;
    const marketClose = 15 * 60 + 30;
    const squareOffTime = 15 * 60 + 20;
    const entryDeadline = 15 * 60 + 0;

    const isMarketOpen = currentMinutes >= marketOpen && currentMinutes < marketClose;
    const isSquareOff = currentMinutes >= squareOffTime;

    // 1. SMART EXIT & TRAILING LOGIC
    paperPortfolio.forEach(item => {
        const data = marketData[item.symbol];
        if (!data || !isMarketOpen) return;

        const currentPnlPercent = ((data.price - item.avgCost) / item.avgCost) * 100;
        const atr = data.technicals.atr || (data.price * 0.015);
        
        let shouldExit = false;
        let exitReason = "";

        // Strategy 1: ATR-Based Dynamic Stop Loss (1.5x ATR)
        const stopPrice = item.avgCost - (atr * 1.5);
        if (data.price < stopPrice) {
            shouldExit = true;
            exitReason = "Volatility Stop (1.5x ATR) Hit";
        }
        // Strategy 2: Profit Trailing (If profit > 3%, set trailing SL at 1.5%)
        else if (currentPnlPercent > 5.0 && data.technicals.score < 50) {
            shouldExit = true;
            exitReason = "Momentum Fade - Profit Locked";
        }
        // Strategy 3: Hard Target
        else if (currentPnlPercent >= 10.0) {
            shouldExit = true;
            exitReason = "High Conviction Target Hit";
        }
        // Strategy 4: EOD Square Off for Intraday
        else if (item.timeframe === 'INTRADAY' && isSquareOff) {
            shouldExit = true;
            exitReason = "EOD Intraday Square Off";
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

    // 2. HIGH-CONVICTION ENTRY LOGIC
    if (!isMarketOpen || currentMinutes >= entryDeadline) return results;
    if (paperPortfolio.length >= MAX_GLOBAL_POSITIONS) return results;

    const topCandidates = recommendations
        .filter(r => {
            const data = marketData[r.symbol];
            if (!data) return false;
            
            const isAlreadyHeld = paperPortfolio.some(p => p.symbol === r.symbol);
            const signals = data.technicals.activeSignals;
            
            // WORLD CLASS FILTER: Must have institutional volume + VWAP support
            const hasInstitutions = signals.some(s => s.includes("Institutional"));
            const hasVWAP = signals.some(s => s.includes("VWAP"));
            const isStrong = data.technicals.score >= 80;

            return isStrong && hasInstitutions && hasVWAP && !isAlreadyHeld;
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
                reason: `Smart Entry: ${data.technicals.activeSignals.join(' + ')}`
            });
            break; 
        }
    }

    return results;
};
