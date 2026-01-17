
import { Candle, StockData, AppSettings } from "../types";
import { analyzeStockTechnical } from "./technicalAnalysis";

const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

// Persistent cache for the current session to avoid redundant network calls
const marketCache: Record<string, { data: StockData, timestamp: number }> = {};
// Map to track active requests and prevent duplicates
const pendingRequests = new Map<string, Promise<StockData | null>>();

/**
 * Get TTL based on the interval. 
 */
const getCacheTTL = (interval: string): number => {
  if (interval.includes('m')) return 2 * 60 * 1000; // 2 mins for intraday
  if (interval.includes('d')) return 30 * 60 * 1000; // 30 mins for daily
  return 4 * 60 * 60 * 1000; // 4 hours for weekly/monthly
};

/**
 * Superfast Proxy Fetcher: Races multiple CORS proxies and takes the fastest successful response.
 */
async function fetchWithProxy(targetUrl: string): Promise<any> {
    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        `https://thingproxy.freeboard.io/fetch/${targetUrl}`
    ];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); 

        const fastestResponse = await (Promise as any).any(proxies.map((url, index) => 
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    fetch(url, { signal: controller.signal })
                        .then(async (res) => {
                            if (!res.ok) throw new Error(`Proxy failed: ${res.status}`);
                            const data = await res.json();
                            if (!data || (data.chart && data.chart.error)) throw new Error('Invalid Yahoo data');
                            resolve(data);
                        })
                        .catch(reject);
                }, index * 100); 
            })
        ));

        clearTimeout(timeoutId);
        return fastestResponse;
    } catch (e) {
        return null;
    }
}

async function parseYahooResponse(data: any): Promise<StockData | null> {
    const result = data?.chart?.result?.[0];
    if (!result || !result.timestamp) return null;

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const candles: Candle[] = [];

    // Optimized loop for faster parsing
    const len = timestamps.length;
    for (let i = 0; i < len; i++) {
        const close = quotes.close[i];
        const open = quotes.open[i];
        if (close != null && open != null) {
            candles.push({
                time: timestamps[i] * 1000,
                open: open,
                high: quotes.high[i] ?? close,
                low: quotes.low[i] ?? close,
                close: close,
                volume: quotes.volume[i] || 0
            });
        }
    }

    if (candles.length < 2) return null;

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

export const fetchRealStockData = async (
    symbol: string, 
    settings: AppSettings, 
    interval: string = "5m", 
    range: string = "1d"
): Promise<StockData | null> => {
    const cacheKey = `${symbol}_${interval}_${range}`;
    
    // Check pending requests first to prevent redundant calls
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)!;
    }

    const cached = marketCache[cacheKey];
    const ttl = getCacheTTL(interval);
    
    if (cached && (Date.now() - cached.timestamp < ttl)) {
        return cached.data;
    }

    const requestPromise = (async () => {
        const ticker = symbol.toUpperCase().includes('.') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
        
        try {
            const cb = Math.floor(Date.now() / 20000); // 20s cache buster
            const targetUrl = `${YAHOO_CHART_BASE}${ticker}?interval=${interval}&range=${range}&_cb=${cb}`;
            
            const yahooRaw = await fetchWithProxy(targetUrl);
            if (yahooRaw) {
                const parsed = await parseYahooResponse(yahooRaw);
                if (parsed) {
                    marketCache[cacheKey] = { data: parsed, timestamp: Date.now() };
                    return parsed;
                }
            }
        } catch (e) {
            console.warn(`Fetch error for ${symbol}:`, e);
        } finally {
            pendingRequests.delete(cacheKey);
        }
        return null;
    })();

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
};
