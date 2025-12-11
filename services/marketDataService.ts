import { Candle, StockData, TechnicalSignals, AppSettings, AssetType } from "../types";
import { analyzeStockTechnical } from "./technicalAnalysis";

const PROXY_URL = "https://api.allorigins.win/raw?url=";
const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

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

async function fetchYahooData(ticker: string, interval: string, range: string): Promise<any> {
    const targetUrl = `${YAHOO_BASE}${ticker}?interval=${interval}&range=${range}`;
    const finalUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}&t=${Date.now()}`; 
    
    try {
        const response = await fetch(finalUrl);
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        return null;
    }
}

async function getYahooStockData(symbol: string): Promise<StockData | null> {
    try {
        // Resolve mapped ticker or default to NSE
        let ticker = TICKER_MAP[symbol];
        
        if (!ticker) {
            // Assume Stock if not in map
            ticker = symbol.toUpperCase().endsWith('.NS') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
        }

        // Try 5m interval first
        let data = await fetchYahooData(ticker, '5m', '5d');
        let result = data?.chart?.result?.[0];

        // Fallback to 1d
        if (!result || !result.timestamp || result.timestamp.length === 0) {
            data = await fetchYahooData(ticker, '1d', '1mo');
            result = data?.chart?.result?.[0];
        }

        if (!result || !result.timestamp) return null;

        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        const candles: Candle[] = [];

        for (let i = 0; i < timestamps.length; i++) {
            if (quotes.open[i] != null && quotes.close[i] != null) {
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
    } catch (error) {
        console.warn(`Yahoo fetch failed for ${symbol}`, error);
        return null;
    }
}

// --- MAIN FETCH FUNCTION ---
export const fetchRealStockData = async (symbol: string, settings?: AppSettings): Promise<StockData | null> => {
    // Yahoo Fallback
    const yahooData = await getYahooStockData(symbol);
    if (yahooData) return yahooData;

    return null;
};