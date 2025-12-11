import { AppSettings, PortfolioItem, AssetType } from "../types";

// --- MOCK SERVER STATE (To simulate broker backend persistence during session) ---
let MOCK_DHAN_DB: PortfolioItem[] = [
    { symbol: 'TATASTEEL', type: 'STOCK', quantity: 150, avgCost: 142.50, totalCost: 21375, broker: 'DHAN' },
    { symbol: 'GOLD', type: 'MCX', quantity: 1, avgCost: 71500.00, totalCost: 71500, broker: 'DHAN' }, // MCX Example
    { symbol: 'RELIANCE', type: 'STOCK', quantity: 25, avgCost: 2850.00, totalCost: 71250, broker: 'DHAN' }
];

let MOCK_SHOONYA_DB: PortfolioItem[] = [
    { symbol: 'SBIN', type: 'STOCK', quantity: 200, avgCost: 580.00, totalCost: 116000, broker: 'SHOONYA' },
    { symbol: 'USDINR', type: 'FOREX', quantity: 1000, avgCost: 83.40, totalCost: 83400, broker: 'SHOONYA' }, // Forex Example
    { symbol: 'ITC', type: 'STOCK', quantity: 400, avgCost: 410.00, totalCost: 164000, broker: 'SHOONYA' }
];

let MOCK_BINANCE_DB: PortfolioItem[] = [
    { symbol: 'BTC', type: 'CRYPTO', quantity: 0.05, avgCost: 62000.00, totalCost: 3100, broker: 'BINANCE' }
];
let MOCK_COINDCX_DB: PortfolioItem[] = [
    { symbol: 'ETH', type: 'CRYPTO', quantity: 1.5, avgCost: 3200.00, totalCost: 4800, broker: 'COINDCX' }
];
let MOCK_COINSWITCH_DB: PortfolioItem[] = [
    { symbol: 'SOL', type: 'CRYPTO', quantity: 10, avgCost: 135.00, totalCost: 1350, broker: 'COINSWITCH' }
];


// Configuration for Slicing Orders
const SLICE_CONFIG: Record<AssetType, number> = {
    STOCK: 50,
    MCX: 1,
    FOREX: 500,
    CRYPTO: 0.1 // Small slice for crypto
};

// --- FETCH HOLDINGS ---

export const fetchDhanHoldings = async (settings: AppSettings): Promise<PortfolioItem[]> => {
  if (!settings.dhanClientId || !settings.dhanAccessToken) return [];
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...MOCK_DHAN_DB];
};

export const fetchShoonyaHoldings = async (settings: AppSettings): Promise<PortfolioItem[]> => {
  if (!settings.shoonyaUserId || !settings.shoonyaPassword) return [];
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...MOCK_SHOONYA_DB];
};

export const fetchBinanceHoldings = async (settings: AppSettings): Promise<PortfolioItem[]> => {
  if (!settings.binanceApiKey) return [];
  await new Promise(resolve => setTimeout(resolve, 400));
  return [...MOCK_BINANCE_DB];
};

export const fetchCoinDCXHoldings = async (settings: AppSettings): Promise<PortfolioItem[]> => {
  if (!settings.coindcxApiKey) return [];
  await new Promise(resolve => setTimeout(resolve, 400));
  return [...MOCK_COINDCX_DB];
};

export const fetchCoinSwitchHoldings = async (settings: AppSettings): Promise<PortfolioItem[]> => {
  if (!settings.coinswitchApiKey) return [];
  await new Promise(resolve => setTimeout(resolve, 400));
  return [...MOCK_COINSWITCH_DB];
};

// --- FETCH BALANCES (Simulated) ---

export const fetchBrokerBalance = async (broker: string, settings: AppSettings): Promise<number> => {
    // Simulate API latency
    await new Promise(r => setTimeout(r, 300));

    switch (broker) {
        case 'DHAN':
            return settings.dhanClientId ? 250000.50 : 0; // Mock 2.5L
        case 'SHOONYA':
            return settings.shoonyaUserId ? 180000.00 : 0; // Mock 1.8L
        case 'BINANCE':
            return settings.binanceApiKey ? 450000.00 : 0; // Mock 4.5L (Converted to INR)
        case 'COINDCX':
            return settings.coindcxApiKey ? 75000.00 : 0; 
        case 'COINSWITCH':
            return settings.coinswitchApiKey ? 25000.00 : 0;
        default:
            return 0;
    }
};


// --- HELPER: EXECUTE SLICED ORDERS ---

const executeSlicedOrder = async (
    broker: 'DHAN' | 'SHOONYA' | 'BINANCE' | 'COINDCX' | 'COINSWITCH',
    symbol: string,
    quantity: number,
    side: 'BUY' | 'SELL',
    price: number,
    assetType: AssetType,
    settings: AppSettings,
    db: PortfolioItem[]
): Promise<{ success: boolean; orderId?: string; message: string }> => {
    
    // 1. Validate Credentials
    if (broker === 'DHAN' && !settings.dhanClientId) return { success: false, message: "Dhan credentials missing" };
    if (broker === 'SHOONYA' && !settings.shoonyaUserId) return { success: false, message: "Shoonya credentials missing" };
    if (broker === 'BINANCE' && !settings.binanceApiKey) return { success: false, message: "Binance API Key missing" };
    if (broker === 'COINDCX' && !settings.coindcxApiKey) return { success: false, message: "CoinDCX API Key missing" };
    if (broker === 'COINSWITCH' && !settings.coinswitchApiKey) return { success: false, message: "CoinSwitch API Key missing" };

    // 2. Validate Sell Capability
    if (side === 'SELL') {
        const existingIdx = db.findIndex(p => p.symbol === symbol);
        if (existingIdx === -1) return { success: false, message: "Position not found" };
        if (db[existingIdx].quantity < quantity) return { success: false, message: "Insufficient quantity" };
    }

    // 3. Execution Loop (Slicing)
    const sliceSize = SLICE_CONFIG[assetType] || 100;
    let remaining = quantity;
    let fills = 0;
    const startTime = Date.now();

    while (remaining > 0) {
        const currentQty = Math.min(remaining, sliceSize);
        
        // Simulate execution latency (e.g., 200ms - 500ms per slice)
        const latency = 200 + Math.random() * 300;
        await new Promise(resolve => setTimeout(resolve, latency));

        if (side === 'BUY') {
            const existing = db.find(p => p.symbol === symbol);
            if (existing) {
                const newTotal = existing.totalCost + (price * currentQty);
                const newQty = existing.quantity + currentQty;
                existing.quantity = newQty;
                existing.totalCost = newTotal;
                existing.avgCost = newTotal / newQty;
            } else {
                db.push({
                    symbol,
                    type: assetType,
                    quantity: currentQty,
                    avgCost: price,
                    totalCost: price * currentQty,
                    broker: broker
                });
            }
        } else {
            // SELL Logic
             const existingIdx = db.findIndex(p => p.symbol === symbol);
             if (existingIdx !== -1) {
                 const existing = db[existingIdx];
                 if (existing.quantity <= currentQty + 0.0001) { // Tolerance for float
                      db.splice(existingIdx, 1);
                 } else {
                      existing.quantity -= currentQty;
                      existing.totalCost = existing.avgCost * existing.quantity; 
                 }
             }
        }

        remaining -= currentQty;
        fills++;
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return { 
        success: true, 
        orderId: `${broker.substring(0,3).toUpperCase()}-${Date.now()}`, 
        message: `Executed ${quantity} qty in ${fills} slices (${duration}s)` 
    };
};

// --- EXECUTE ORDERS (Simulating API Calls) ---

export const placeDhanOrder = async (symbol: string, quantity: number, side: 'BUY' | 'SELL', price: number, assetType: AssetType, settings: AppSettings) => {
    return executeSlicedOrder('DHAN', symbol, quantity, side, price, assetType, settings, MOCK_DHAN_DB);
};

export const placeShoonyaOrder = async (symbol: string, quantity: number, side: 'BUY' | 'SELL', price: number, assetType: AssetType, settings: AppSettings) => {
    return executeSlicedOrder('SHOONYA', symbol, quantity, side, price, assetType, settings, MOCK_SHOONYA_DB);
};

export const placeBinanceOrder = async (symbol: string, quantity: number, side: 'BUY' | 'SELL', price: number, assetType: AssetType, settings: AppSettings) => {
    return executeSlicedOrder('BINANCE', symbol, quantity, side, price, assetType, settings, MOCK_BINANCE_DB);
};

export const placeCoinDCXOrder = async (symbol: string, quantity: number, side: 'BUY' | 'SELL', price: number, assetType: AssetType, settings: AppSettings) => {
    return executeSlicedOrder('COINDCX', symbol, quantity, side, price, assetType, settings, MOCK_COINDCX_DB);
};

export const placeCoinSwitchOrder = async (symbol: string, quantity: number, side: 'BUY' | 'SELL', price: number, assetType: AssetType, settings: AppSettings) => {
    return executeSlicedOrder('COINSWITCH', symbol, quantity, side, price, assetType, settings, MOCK_COINSWITCH_DB);
};