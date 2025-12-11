import { Candle, StockData, TechnicalSignals, AppSettings, AssetType } from "../types";
import { analyzeStockTechnical } from "./technicalAnalysis";

// CORS Proxy for Yahoo Finance
// Alternative proxies: 'https://corsproxy.io/?', 'https://api.allorigins.win/raw?url='
const PROXY_URL = "https://corsproxy.io/?";
const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

// Mapping Indian MCX symbols to Global Futures/Proxies for data simulation
const TICKER_MAP: { [key: string]: string } = {
    // MCX
    'GOLD': 'GC=F',       // Gold Futures
    'SILVER': 'SI=F',     // Silver Futures
    'CRUDEOIL': 'CL=F',   // Crude Oil Futures
    'NATURALGAS': 'NG=F', // Natural Gas Futures
    'COPPER': 'HG=F',     // Copper Futures
    'ZINC': 'ZINC.L',     // LME Zinc (Proxy)
    'ALUMINIUM': 'ALI=F', // Aluminum Futures
    'LEAD': 'LEAD.L',     // LME Lead
    
    // FOREX
    'USDINR': 'USDINR=X',
    'EURINR': 'EURINR=X',
    'GBPINR': 'GBPINR=X',
    'JPYINR': 'JPYINR=X',
    'EURUSD': 'EURUSD=X',
    'GBPUSD': 'GBPUSD=X',

    // CRYPTO
    'BTC': 'BTC-USD',
    'ETH': 'ETH-USD',
    'SOL': 'SOL-USD',
    'BNB': 'BNB-USD',
    'XRP': 'XRP-USD',
    'ADA': 'ADA-USD',
    'ARP': 'XRP-USD', // Handling user typo mapping
    'XDA': 'ADA-USD'  // Handling user typo mapping
};

// --- API FETCHERS ---

// 1. Yahoo Finance (Primary Free Source)
async function fetchYahooData(ticker: string, interval: string = '5m', range: string = '5d'): Promise<any> {
    const targetUrl = `${YAHOO_CHART_BASE}${ticker}?interval=${interval}&range=${range}`;
    const finalUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`; 
    
    try {
        const response = await fetch(finalUrl);
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        // Fallback to AllOrigins if CORSProxy fails
        try {
             const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
             const res = await fetch(fallbackUrl);
             if(!res.ok) return null;
             return await res.json();
        } catch(err) {
            return null;
        }
    }
}

// 2. Dhan API Stub (Placeholder for Real Implementation)
async function fetchDhanData(symbol: string, settings: AppSettings): Promise<StockData | null> {
    if (!settings.dhanClientId || !settings.dhanAccessToken) return null;
    
    // NOTE: Direct client-side calls to Dhan API usually require a backend proxy due to CORS 
    // and security of secrets. This is a structural placeholder.
    // In a production app, you would call `your-backend.com/api/dhan/quote/${symbol}`
    return null; 
}

// 3. Shoonya API Stub (Placeholder for Real Implementation)
async function fetchShoonyaData(symbol: string, settings: AppSettings): Promise<StockData | null> {
    if (!settings.shoonyaUserId || !settings.shoonyaPassword) return null;
    return null;
}


// --- PARSERS ---

async function parseYahooResponse(symbol: string, data: any): Promise<StockData | null> {
    const result = data?.chart?.result?.[0];
    if (!result || !result.timestamp) return null;

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const candles: Candle[] = [];

    for (let i = 0; i < timestamps.length; i++) {
        // Filter out nulls (common in Yahoo data)
        if (quotes.open[i] != null && quotes.close[i] != null && quotes.high[i] != null && quotes.low[i] != null) {
            candles.push({
                time: timestamps[i] * 1000,
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i],
                volume: quotes.volume[i] || 0
            });
        }
    }

    if (candles.length === 0) return null;

    const lastCandle = candles[candles.length - 1];
    const technicals = analyzeStockTechnical(candles);
    const meta = result.meta;
    const prevClose = meta.chartPreviousClose || candles[0].open;
    
    return {
        price: lastCandle.close,
        change: lastCandle.close - prevClose,
        changePercent: ((lastCandle.close - prevClose) / prevClose) * 100,
        history: candles,
        technicals
    };
}


// --- MAIN FETCH FUNCTION ---

export const fetchRealStockData = async (symbol: string, settings: AppSettings): Promise<StockData | null> => {
    
    // 1. Try Broker APIs first if configured (Dhan/Shoonya)
    // In this demo, these return null effectively skipping to Yahoo, 
    // but the structure supports real implementation.
    let data = await fetchDhanData(symbol, settings);
    if (data) return data;

    data = await fetchShoonyaData(symbol, settings);
    if (data) return data;

    // 2. Try Yahoo Finance (Primary Public Source)
    // Resolve mapped ticker (e.g., GOLD -> GC=F) or default to NSE (RELIANCE -> RELIANCE.NS)
    let ticker = TICKER_MAP[symbol];
    if (!ticker) {
        // Assume Stock if not in map
        ticker = symbol.toUpperCase().endsWith('.NS') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
    }

    const yahooRaw = await fetchYahooData(ticker);
    if (yahooRaw) {
        const parsed = await parseYahooResponse(symbol, yahooRaw);
        if (parsed) return parsed;
    }

    // 3. Fail gracefully (Caller handles fallback/mocking)
    return null;
};
