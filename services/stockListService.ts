
const STATIC_NSE_LIST = `Symbol
RELIANCE
TCS
INFY
HCLTECH
LTIM
COFORGE
TECHM
PERSISTENT
LTTS
HDFCBANK
ICICIBANK
KOTAKBANK
AXISBANK
SBIN
INDUSINDBK
BAJFINANCE
BAJAJFINSV
HDFCLIFE
SBILIFE
SHRIRAMFIN
TMPV
TMCV
MARUTI
EICHERMOT
TVSMOTOR
ASHOKLEY
ASIANPAINT
PIDILITIND
BERGEPAINT
ULTRACEMCO
AMBUJACEM
ACC
JKCEMENT
HINDUNILVR
MARICO
TATACONSUM
SUNPHARMA
CIPLA
DIVISLAB
DRREDDY
ZYDUSLIFE
TORNTPHARM
LT
BEL
BHEL
HAL
SIEMENS
ABB
CUMMINSIND
THERMAX
BSE
TATASTEEL
JSWSTEEL
JINDALSTEL
HINDALCO
COALINDIA
NMDC
HINDZINC
NTPC
POWERGRID
TATAPOWER
JSWENERGY
WAAREEENER
OLECTRA
ONGC
GAIL
IOC
BPCL
HINDPETRO
OIL
IRFC
RVNL
IRCON
CONCOR
TCIEXP
GMRINFRA
NCC
NBCC
APOLLOHOSP
LALPATHLAB
INDHOTEL
LEMONTREE
GODREJPROP
PHOENIXLTD
PFC
RECLTD
NHPC
SJVN
ATUL
TANLA
MAPMYINDIA
KAYNES
CYBERTECH
KPIL
R R KABEL
IDEAFORGE
HAPPYFORGE
CHEMPLASTS
EPL
APTUS
UTIAMC
CAMSERV
FINEORG
NEULANDLAB
ROSSARI
TARC
INOXGREEN
DJMART
VEDL;

export const STATIC_MCX_LIST = [
    "GOLD", "SILVER", "CRUDEOIL", "NATURALGAS", "COPPER", "ZINC", "ALUMINIUM", "LEAD"
];

export const STATIC_FOREX_LIST = [
    "USDINR", "EURINR", "GBPINR", "JPYINR", "EURUSD", "GBPUSD"
];

export const STATIC_CRYPTO_LIST = [
    "BTC", "ETH", "SOL", "BNB", "XRP", "ADA"
];

let NAME_CACHE: Map<string, string> | null = null;

const initNameCache = () => {
    if (NAME_CACHE) return;
    NAME_CACHE = new Map<string, string>();
    const lines = STATIC_NSE_LIST.split('\n');
    
    // Support basic list where each line is just a Symbol
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        let sym = parts[0].trim().toUpperCase();
        
        // Ensure .NS in cache keys
        if (sym && !sym.endsWith('.NS')) {
             sym = sym + '.NS';
        }

        if (sym) {
            NAME_CACHE.set(sym, sym); 
        }
    }
};

export const getCompanyName = (symbol: string): string => {
    // If not cached, try to init
    if (!NAME_CACHE) initNameCache();
    
    const upperSymbol = symbol.toUpperCase();
    
    // Try exact match
    if (NAME_CACHE?.has(upperSymbol)) return NAME_CACHE.get(upperSymbol)!;
    
    // Try adding .NS if missing
    if (!upperSymbol.endsWith('.NS') && NAME_CACHE?.has(upperSymbol + '.NS')) {
        return NAME_CACHE.get(upperSymbol + '.NS')!;
    }
    
    // Common Commodities
    if (STATIC_MCX_LIST.includes(upperSymbol)) return `${upperSymbol} Futures`;
    if (STATIC_FOREX_LIST.includes(upperSymbol)) return `${upperSymbol.substring(0,3)}/${upperSymbol.substring(3)}`;
    if (STATIC_CRYPTO_LIST.includes(upperSymbol)) return `${upperSymbol} Crypto`;
    
    // Force .NS for unknown stocks if not special
    if (!upperSymbol.includes('.') && !STATIC_MCX_LIST.includes(upperSymbol) && !STATIC_FOREX_LIST.includes(upperSymbol) && !STATIC_CRYPTO_LIST.includes(upperSymbol)) {
        return upperSymbol + '.NS';
    }

    return upperSymbol; 
};

// Helper to parse CSV dynamically
const parseCSV = (text: string): string[] => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    const symbols: Set<string> = new Set();
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(',');
        let sym = cols[0].trim().toUpperCase();
            
        if (sym && /^[A-Z0-9&]+$/.test(sym) && sym !== 'SYMBOL') {
             // Append .NS here so the whole app uses it
             if (!sym.endsWith('.NS')) {
                 sym = sym + '.NS';
             }
             symbols.add(sym);
        }
    }
    
    return Array.from(symbols);
};

export const checkAndRefreshStockList = async (): Promise<string[]> => {
    return parseCSV(STATIC_NSE_LIST);
}
