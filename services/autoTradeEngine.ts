
import { AppSettings, MarketData, PortfolioItem, StockRecommendation, Transaction, Funds, AssetType } from "../types";
import { getMarketStatus } from "./marketStatusService";

export interface TradeResult {
    executed: boolean;
    transaction?: Transaction;
    newFunds?: Funds;
    newPortfolio?: PortfolioItem[];
    reason?: string;
}

// Config Constants
const MAX_POSITIONS = 5;
const SLICE_PERCENTAGE = 0.25; // Buy 25% of target allocation per slice (sliced manner)

export const runAutoTradeEngine = (
    settings: AppSettings, 
    portfolio: PortfolioItem[], 
    marketData: MarketData, 
    funds: Funds,
    recommendations: StockRecommendation[]
): TradeResult[] => {
    
    // Only run if paper bot is enabled
    if (!settings.activeBrokers.includes('PAPER')) return [];

    const results: TradeResult[] = [];
    let currentFunds = { ...funds };
    
    // Filter for current open paper positions
    const paperPortfolio = portfolio.filter(p => p.broker === 'PAPER');
    const openSymbols = paperPortfolio.map(p => p.symbol);

    // Helper to get fund bucket key
    const getFundKey = (type: AssetType): keyof Funds => {
        if (type === 'MCX') return 'mcx';
        if (type === 'FOREX') return 'forex';
        if (type === 'CRYPTO') return 'crypto';
        return 'stock';
    };

    // 1. MANAGE EXITS & HOLDING (Check Existing Positions)
    paperPortfolio.forEach(item => {
        // CHECK MARKET STATUS
        const marketStatus = getMarketStatus(item.type);
        if (!marketStatus.isOpen && item.type !== 'CRYPTO') return; // Hold if market closed

        const data = marketData[item.symbol];
        if (!data) return;

        const price = data.price;
        const pnlPercent = ((price - item.avgCost) / item.avgCost) * 100;
        const score = data.technicals.score;

        // EXIT RULES
        // Sell if:
        // 1. Stop Loss Hit (-2%)
        // 2. Target Hit (+5%)
        // 3. Technical Score drops below 30 (Weakness)
        let action = null;
        if (pnlPercent <= -2) action = 'STOP_LOSS';
        else if (pnlPercent >= 5) action = 'TARGET_HIT';
        else if (score < 30) action = 'WEAK_SIGNAL';
        
        if (action) {
            const fundKey = getFundKey(item.type);
            currentFunds[fundKey] += (price * item.quantity); // Add back to specific fund
            
            const tx: Transaction = {
                id: `auto-sell-${Date.now()}-${Math.random()}`,
                type: 'SELL',
                symbol: item.symbol,
                assetType: item.type,
                quantity: item.quantity,
                price: price,
                timestamp: Date.now(),
                broker: 'PAPER'
            };
            results.push({ executed: true, transaction: tx, newFunds: { ...currentFunds }, reason: `Auto ${action}` });
        }
    });

    // 2. MANAGE ENTRIES (Sliced Entry for Best 5)
    // We check slots PER ASSET TYPE ideally, but for now we keep a global max of 5 active paper trades to control risk
    // Or we can allow 5 per category. Let's stick to global MAX_POSITIONS for safety or 5 per category if funds allow.
    // The prompt implied "Best 5 stock recommendations", so let's try to trade the best ones available.
    
    // Filter recommendations for "Strong Buy" signals
    // Sorted by Score (High to Low) to get "Best" candidates
    const candidates = recommendations
        .filter(rec => {
            // Check if market enabled in settings
            const settingsKey = rec.type === 'STOCK' ? 'stocks' : rec.type.toLowerCase() as keyof typeof settings.enabledMarkets;
            if (!settings.enabledMarkets[settingsKey]) return false;

            const status = getMarketStatus(rec.type);
            if (!status.isOpen && rec.type !== 'CRYPTO') return false;
            
            const data = marketData[rec.symbol];
            return data && data.technicals.signalStrength === 'STRONG BUY';
        })
        .sort((a, b) => {
            const scoreA = marketData[a.symbol]?.technicals.score || 0;
            const scoreB = marketData[b.symbol]?.technicals.score || 0;
            return scoreB - scoreA;
        });

    for (const rec of candidates) {
        const data = marketData[rec.symbol];
        if (!data) continue;

        const fundKey = getFundKey(rec.type);
        const existingPosition = paperPortfolio.find(p => p.symbol === rec.symbol);
        
        // Calculate Target Trade Size based on Capital in that specific bucket
        // If FIXED mode: use fixed amount.
        // If PERCENTAGE mode: use % of THAT bucket's total capital (Cash + Invested in that bucket)
        
        let allocationPerTrade = 0;
        if (settings.autoTradeConfig.mode === 'FIXED') {
            allocationPerTrade = settings.autoTradeConfig.value;
        } else {
            // Calculate total capital for this asset class
            const investedInType = paperPortfolio
                .filter(p => p.type === rec.type)
                .reduce((acc, p) => acc + (p.avgCost * p.quantity), 0);
            
            const totalTypeCapital = currentFunds[fundKey] + investedInType;
            allocationPerTrade = totalTypeCapital * (settings.autoTradeConfig.value / 100);
        }
        
        // Sliced Entry Amount (e.g., 25% of target allocation)
        const sliceAmount = allocationPerTrade * SLICE_PERCENTAGE;

        // Scenario A: Adding to existing position (Slicing In)
        if (existingPosition) {
            const currentInvested = existingPosition.avgCost * existingPosition.quantity;
            if (currentInvested < allocationPerTrade) {
                // We have room to add a slice
                const qty = Math.floor(sliceAmount / data.price);
                // Check specific fund balance
                if (qty > 0 && currentFunds[fundKey] >= (qty * data.price)) {
                    currentFunds[fundKey] -= (qty * data.price);
                    const tx: Transaction = {
                        id: `auto-buy-slice-${Date.now()}-${Math.random()}`,
                        type: 'BUY',
                        symbol: rec.symbol,
                        assetType: rec.type,
                        quantity: qty,
                        price: data.price,
                        timestamp: Date.now(),
                        broker: 'PAPER'
                    };
                    results.push({ executed: true, transaction: tx, newFunds: { ...currentFunds }, reason: "Auto Slice-In (Trend Confirmation)" });
                    break; 
                }
            }
        } 
        // Scenario B: New Entry (If slots available)
        else if (openSymbols.length < MAX_POSITIONS) {
            const qty = Math.floor(sliceAmount / data.price);
            // Check specific fund balance
            if (qty > 0 && currentFunds[fundKey] >= (qty * data.price)) {
                currentFunds[fundKey] -= (qty * data.price);
                const tx: Transaction = {
                    id: `auto-buy-new-${Date.now()}-${Math.random()}`,
                    type: 'BUY',
                    symbol: rec.symbol,
                    assetType: rec.type,
                    quantity: qty,
                    price: data.price,
                    timestamp: Date.now(),
                    broker: 'PAPER'
                };
                results.push({ executed: true, transaction: tx, newFunds: { ...currentFunds }, reason: "Auto Entry (Top Pick)" });
                break; 
            }
        }
    }

    return results;
};

// Simulate "Offline" trades
export const simulateBackgroundTrades = (
    lastRunTime: number, 
    settings: AppSettings, 
    funds: Funds
): { newTransactions: Transaction[], newFunds: Funds } => {
    return { newTransactions: [], newFunds: funds };
};
