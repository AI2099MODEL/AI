
const STORAGE_KEY = 'aitrade_watchlist';

export interface MasterStock {
    symbol: string;
    name: string;
    sector: string;
}

// Simulated CSV Data Source
export const MASTER_STOCK_LIST: MasterStock[] = [
    { symbol: 'BSE.NS', name: 'BSE Limited', sector: 'Financial Services' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking' },
    { symbol: 'INFY.NS', name: 'Infosys', sector: 'IT' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
    { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'Consumer Goods' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Construction' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', sector: 'Conglomerate' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Consumer Goods' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Automobile' },
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', sector: 'Healthcare' },
    { symbol: 'TITAN.NS', name: 'Titan Company', sector: 'Consumer Goods' },
    { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Materials' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Financial Services' },
    { symbol: 'WIPRO.NS', name: 'Wipro Limited', sector: 'IT' },
    { symbol: 'NTPC.NS', name: 'NTPC Limited', sector: 'Utilities' },
    { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', sector: 'Automobile' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Automobile' },
    { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp', sector: 'Energy' },
    { symbol: 'POWERGRID.NS', name: 'Power Grid Corp', sector: 'Utilities' },
];

const DEFAULT_WATCHLIST = ['BSE.NS', 'SBIN.NS', 'RELIANCE.NS'];

export const checkAndRefreshStockList = async (): Promise<string[]> => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return DEFAULT_WATCHLIST;
        }
    }
    return DEFAULT_WATCHLIST;
};

export const updateWatchlist = (newList: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    return newList;
};

export const addToWatchlist = (symbol: string) => {
    const formatted = symbol.toUpperCase().endsWith('.NS') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
    const saved = localStorage.getItem(STORAGE_KEY);
    const list: string[] = saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    if (!list.includes(formatted)) {
        const newList = [...list, formatted];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        return newList;
    }
    return list;
};

export const removeFromWatchlist = (symbol: string) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const list: string[] = saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    const newList = list.filter((s: string) => s !== symbol);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    return newList;
};
