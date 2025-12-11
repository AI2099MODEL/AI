const STATIC_NSE_LIST = `Company Name,Industry,Symbol,Series,ISIN Code
360 ONE WAM Ltd.,Financial Services,360ONE,EQ,INE466L01038
3M India Ltd.,Diversified,3MINDIA,EQ,INE470A01017
ABB India Ltd.,Capital Goods,ABB,EQ,INE117A01022
ACC Ltd.,Construction Materials,ACC,EQ,INE012A01025
AIA Engineering Ltd.,Capital Goods,AIAENG,EQ,INE212H01026
APL Apollo Tubes Ltd.,Capital Goods,APLAPOLLO,EQ,INE702C01027
AU Small Finance Bank Ltd.,Financial Services,AUBANK,EQ,INE949L01017
Aarti Industries Ltd.,Chemicals,AARTIIND,EQ,INE769A01020
Abbott India Ltd.,Healthcare,ABBOTINDIA,EQ,INE358A01014
Adani Enterprises Ltd.,Metals & Mining,ADANIENT,EQ,INE423A01024
Adani Green Energy Ltd.,Power,ADANIGREEN,EQ,INE364U01010
Adani Ports and Special Economic Zone Ltd.,Services,ADANIPORTS,EQ,INE742F01042
Adani Power Ltd.,Power,ADANIPOWER,EQ,INE814H01029
Ashok Leyland Ltd.,Capital Goods,ASHOKLEY,EQ,INE208A01029
Asian Paints Ltd.,Consumer Durables,ASIANPAINT,EQ,INE021A01026
Astral Ltd.,Capital Goods,ASTRAL,EQ,INE006I01046
Axis Bank Ltd.,Financial Services,AXISBANK,EQ,INE238A01034
Bajaj Auto Ltd.,Automobile and Auto Components,BAJAJ-AUTO,EQ,INE917I01010
Bajaj Finance Ltd.,Financial Services,BAJAJFINANCE,EQ,INE296A01032
Bajaj Finserv Ltd.,Financial Services,BAJAJFINSV,EQ,INE918I01026
Bank of Baroda,Financial Services,BANKBARODA,EQ,INE028A01039
Bharat Electronics Ltd.,Capital Goods,BEL,EQ,INE263A01024
Bharat Petroleum Corporation Ltd.,Oil Gas & Consumable Fuels,BPCL,EQ,INE029A01011
Bharti Airtel Ltd.,Telecommunication,BHARTIARTL,EQ,INE397D01024
Britannia Industries Ltd.,Fast Moving Consumer Goods,BRITANNIA,EQ,INE216A01030
Cipla Ltd.,Healthcare,CIPLA,EQ,INE059A01026
Coal India Ltd.,Oil Gas & Consumable Fuels,COALINDIA,EQ,INE522F01014
Divi's Laboratories Ltd.,Healthcare,DIVISLAB,EQ,INE361B01024
Dr. Reddy's Laboratories Ltd.,Healthcare,DRREDDY,EQ,INE089A01031
Eicher Motors Ltd.,Automobile and Auto Components,EICHERMOT,EQ,INE066A01021
Grasim Industries Ltd.,Construction Materials,GRASIM,EQ,INE047A01021
HCL Technologies Ltd.,Information Technology,HCLTECH,EQ,INE860A01027
HDFC Bank Ltd.,Financial Services,HDFCBANK,EQ,INE040A01034
HDFC Life Insurance Company Ltd.,Financial Services,HDFCLIFE,EQ,INE795G01014
Havells India Ltd.,Consumer Durables,HAVELLS,EQ,INE176B01034
Hero MotoCorp Ltd.,Automobile and Auto Components,HEROMOTOCO,EQ,INE158A01026
Hindalco Industries Ltd.,Metals & Mining,HINDALCO,EQ,INE038A01020
Hindustan Aeronautics Ltd.,Capital Goods,HAL,EQ,INE066F01020
Hindustan Unilever Ltd.,Fast Moving Consumer Goods,HINDUNILVR,EQ,INE030A01027
ICICI Bank Ltd.,Financial Services,ICICIBANK,EQ,INE090A01021
ITC Ltd.,Fast Moving Consumer Goods,ITC,EQ,INE154A01025
Indian Oil Corporation Ltd.,Oil Gas & Consumable Fuels,IOC,EQ,INE242A01010
IndusInd Bank Ltd.,Financial Services,INDUSINDBK,EQ,INE095A01012
Infosys Ltd.,Information Technology,INFY,EQ,INE009A01021
JSW Steel Ltd.,Metals & Mining,JSWSTEEL,EQ,INE019A01038
Kotak Mahindra Bank Ltd.,Financial Services,KOTAKBANK,EQ,INE237A01028
L&T Technology Services Ltd.,Information Technology,LTTS,EQ,INE010V01017
Larsen & Toubro Ltd.,Construction,LT,EQ,INE018A01030
Mahindra & Mahindra Ltd.,Automobile and Auto Components,M&M,EQ,INE101A01026
Maruti Suzuki India Ltd.,Automobile and Auto Components,MARUTI,EQ,INE585B01010
Nestle India Ltd.,Fast Moving Consumer Goods,NESTLEIND,EQ,INE239A01024
NTPC Ltd.,Power,NTPC,EQ,INE733E01010
Oil & Natural Gas Corporation Ltd.,Oil Gas & Consumable Fuels,ONGC,EQ,INE213A01029
Power Grid Corporation of India Ltd.,Power,POWERGRID,EQ,INE752E01010
Reliance Industries Ltd.,Oil Gas & Consumable Fuels,RELIANCE,EQ,INE002A01018
SBI Life Insurance Company Ltd.,Financial Services,SBILIFE,EQ,INE123W01016
State Bank of India,Financial Services,SBIN,EQ,INE062A01020
Sun Pharmaceutical Industries Ltd.,Healthcare,SUNPHARMA,EQ,INE044A01036
Tata Consultancy Services Ltd.,Information Technology,TCS,EQ,INE467B01029
Tata Consumer Products Ltd.,Fast Moving Consumer Goods,TATACONSUM,EQ,INE192A01025
Tata Motors Passenger Vehicles Ltd.,Automobile and Auto Components,TATAMOTORS,EQ,INE155A01022
Tata Steel Ltd.,Metals & Mining,TATASTEEL,EQ,INE081A01020
Tech Mahindra Ltd.,Information Technology,TECHM,EQ,INE669C01036
Titan Company Ltd.,Consumer Durables,TITAN,EQ,INE280A01028
UltraTech Cement Ltd.,Construction Materials,ULTRACEMCO,EQ,INE481G01011
Wipro Ltd.,Information Technology,WIPRO,EQ,INE075A01022
Zomato Ltd.,Tech,ZOMATO,EQ,INE768C01010`;

export const STATIC_MCX_LIST = [
    "GOLD", "SILVER", "CRUDEOIL", "NATURALGAS", "COPPER", "ZINC", "ALUMINIUM", "LEAD"
];

export const STATIC_FOREX_LIST = [
    "USDINR", "EURINR", "GBPINR", "JPYINR", "EURUSD", "GBPUSD"
];

export const STATIC_CRYPTO_LIST = [
    "BTC", "ETH", "SOL", "BNB", "XRP", "ADA"
];

// Helper to parse CSV dynamically based on header
const parseCSV = (text: string): string[] => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    // Clean and parse header to find 'SYMBOL' column
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.replace(/"/g, '').trim().toUpperCase());
    
    const symbolIdx = headers.findIndex(h => h === 'SYMBOL');
    
    if (symbolIdx === -1) {
        return [];
    }

    const symbols: Set<string> = new Set();
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(',');
        
        if (cols.length > symbolIdx) {
            const rawSymbol = cols[symbolIdx];
            const sym = rawSymbol ? rawSymbol.replace(/"/g, '').trim() : '';
            
            if (sym && /^[A-Z0-9]+$/.test(sym) && sym !== 'SYMBOL') {
                symbols.add(sym);
            }
        }
    }
    
    return Array.from(symbols);
};

export const checkAndRefreshStockList = async (): Promise<string[]> => {
    return parseCSV(STATIC_NSE_LIST);
}