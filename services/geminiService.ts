import { GoogleGenAI, Type } from "@google/genai";
import {
  StockRecommendation,
  MarketSettings,
  PortfolioItem,
  HoldingAnalysis,
  MarketData
} from "../types";
import { getCompanyName } from "./stockListService";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (aiInstance) return aiInstance;
  const apiKey = typeof process !== "undefined" ? process.env.API_KEY : "";
  if (!apiKey) console.warn("Gemini API Key is missing.");
  aiInstance = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });
  return aiInstance;
};

const getISTTimeMinutes = () => {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  return istDate.getHours() * 60 + istDate.getMinutes();
};

/**
 * NOTE: This service returns CLEAN base symbols for NSE stocks (e.g. TCS, RELIANCE, TATASTEEL).
 * When calling yfinance from Python, append ".NS" yourself:
 *   yf_symbol = symbol + ".NS"  // e.g. "TCS.NS"
 * NSE stocks on Yahoo use ".NS" suffix. [web:3][web:5]
 */
export const fetchTopStockPicks = async (
  totalCapital: number,
  stockUniverse: string[] = [],
  markets: MarketSettings = { stocks: true, mcx: false, forex: false, crypto: false }
): Promise<StockRecommendation[]> => {
  const currentMinutes = getISTTimeMinutes();
  const isPostMarket = currentMinutes > 930;

  try {
    const ai = getAI();
    if (!process.env.API_KEY) throw new Error("No API Key");

    const requests: string[] = [];

    const availableStocks =
      stockUniverse.length > 0 ? stockUniverse.join(", ") : "Top Liquid NSE Stocks";

    if (markets.stocks) {
      requests.push(
        `Stock Recommendations selected STRICTLY from this provided list: [${availableStocks}].
        Categorize them exactly as follows:
        - 2 stocks for 'INTRADAY' (High momentum, tight stop loss)
        - 2 stocks for 'BTST' (Buy Today Sell Tomorrow)
        - 2 stocks for 'WEEKLY' (Short Term 5-7 days)
        - 1 stock for 'MONTHLY' (Positional)`
      );
    }
    if (markets.mcx) requests.push("2 MCX Commodities (Intraday/Positional)");
    if (markets.forex) requests.push("2 Forex Pairs (INR pairs)");
    if (markets.crypto) requests.push("3 Crypto Assets (Top Gainers/Breakouts)");

    if (requests.length === 0) return [];

    const prompt = `Act as 'AI Robots' trading engine powered by Advanced Technical Analysis.
    REQUIREMENT: Provide exactly: ${requests.join(", ")}.

    ANALYSIS METHODOLOGY:
    You must simulate analyzing the Live Trading Charts (Candlestick patterns).
    For each pick, identify a specific 'Chart Pattern' (e.g., Bull Flag, Cup & Handle, Double Bottom, Ascending Triangle).

    IMPORTANT JSON RULES:
    1. Output ONLY the official ticker symbol WITHOUT any exchange suffix in 'symbol' field (e.g. TATAMOTORS, RELIANCE, TCS).
    2. Do NOT include ".NS" or ".BO" in the symbol.
    3. Assign 'type' correctly ('STOCK', 'MCX', 'FOREX', 'CRYPTO').
    4. For MCX/Forex, provide lot size.
    5. For Stocks, explicitly set 'timeframe' to 'INTRADAY', 'BTST', 'WEEKLY', or 'MONTHLY'.
    6. Include the identified 'chartPattern'.

    Return the response as a JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an expert technical analyst using Moving Averages, RSI, MACD, and Price Action. Time: ${
          isPostMarket ? "After Close" : "Live"
        }.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["STOCK", "MCX", "FOREX", "CRYPTO"] },
              sector: { type: Type.STRING },
              currentPrice: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              chartPattern: {
                type: Type.STRING,
                description: "e.g., Bull Flag, Head & Shoulders"
              },
              riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              targetPrice: { type: Type.NUMBER },
              lotSize: { type: Type.NUMBER },
              timeframe: {
                type: Type.STRING,
                enum: ["INTRADAY", "BTST", "WEEKLY", "MONTHLY"]
              }
            },
            required: [
              "symbol",
              "name",
              "type",
              "sector",
              "currentPrice",
              "reason",
              "riskLevel",
              "targetPrice",
              "lotSize",
              "chartPattern"
            ]
          }
        }
      }
    });

    let data: StockRecommendation[] = [];

    if (response.text) {
      const raw = JSON.parse(response.text) as StockRecommendation[];

      data = raw
        .map((item) => {
          const rawSymbol = (item.symbol || "").toUpperCase().trim();

          // strip any accidental ".NS" / ".BO" from AI
          const baseSymbol = rawSymbol.replace(/\.(NS|BO)$/i, "");

          let finalName = item.name;
          if (item.type === "STOCK") {
            const csvName = getCompanyName(baseSymbol);
            if (csvName && csvName !== baseSymbol) {
              finalName = csvName;
            } else if (
              !finalName ||
              finalName.toUpperCase() === rawSymbol ||
              finalName.toUpperCase() === `${baseSymbol}.NS`
            ) {
              finalName = csvName || baseSymbol;
            }
          }

          return {
            ...item,
            symbol: baseSymbol, // clean base symbol (used later as base for yfinance ".NS")
            name: finalName
          };
        })
        // filter out any garbage symbols to avoid crashing yfinance
        .filter((item) => !!item.symbol && /^[A-Z0-9]+$/.test(item.symbol));
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch picks (Using Fallback):", error);

    const fallback: StockRecommendation[] = [];

    if (markets.stocks) {
      fallback.push({
        symbol: "TATASTEEL",
        name: getCompanyName("TATASTEEL"),
        type: "STOCK",
        sector: "Metals",
        currentPrice: 150,
        reason: "Global Infra Push",
        riskLevel: "Medium",
        targetPrice: 160,
        lotSize: 1,
        timeframe: "WEEKLY",
        chartPattern: "Ascending Triangle"
      });
      fallback.push({
        symbol: "TATAPOWER",
        name: getCompanyName("TATAPOWER"),
        type: "STOCK",
        sector: "Power",
        currentPrice: 410,
        reason: "Green Energy Demand",
        riskLevel: "Medium",
        targetPrice: 440,
        lotSize: 1,
        timeframe: "MONTHLY",
        chartPattern: "Cup and Handle"
      });
      fallback.push({
        symbol: "TCS",
        name: getCompanyName("TCS"),
        type: "STOCK",
        sector: "IT",
        currentPrice: 4000,
        reason: "Deal Wins",
        riskLevel: "Low",
        targetPrice: 4200,
        lotSize: 1,
        timeframe: "MONTHLY",
        chartPattern: "Double Bottom"
      });
      fallback.push({
        symbol: "RELIANCE",
        name: getCompanyName("RELIANCE"),
        type: "STOCK",
        sector: "Energy",
        currentPrice: 2900,
        reason: "Telecom ARPU",
        riskLevel: "Medium",
        targetPrice: 3000,
        lotSize: 1,
        timeframe: "WEEKLY",
        chartPattern: "Channel Up"
      });
      fallback.push({
        symbol: "SBIN",
        name: getCompanyName("SBIN"),
        type: "STOCK",
        sector: "Bank",
        currentPrice: 780,
        reason: "Support Bounce",
        riskLevel: "Low",
        targetPrice: 800,
        lotSize: 1,
        timeframe: "BTST",
        chartPattern: "Double Bottom"
      });
      fallback.push({
        symbol: "ITC",
        name: getCompanyName("ITC"),
        type: "STOCK",
        sector: "FMCG",
        currentPrice: 420,
        reason: "Defensive",
        riskLevel: "Low",
        targetPrice: 450,
        lotSize: 1,
        timeframe: "MONTHLY",
        chartPattern: "Channel Up"
      });
    }

    if (markets.mcx)
      fallback.push({
        symbol: "GOLD",
        name: "Gold Futures (MCX)",
        type: "MCX",
        sector: "Commodity",
        currentPrice: 72000,
        reason: "Safe Haven",
        riskLevel: "Low",
        targetPrice: 72500,
        lotSize: 1,
        timeframe: "INTRADAY",
        chartPattern: "Cup and Handle"
      });

    if (markets.crypto)
      fallback.push({
        symbol: "BTC",
        name: "Bitcoin",
        type: "CRYPTO",
        sector: "Digital",
        currentPrice: 65000,
        reason: "ETF Inflow",
        riskLevel: "High",
        targetPrice: 66000,
        lotSize: 0.01,
        timeframe: "INTRADAY",
        chartPattern: "Golden Cross"
      });

    return fallback;
  }
};

export const analyzeHoldings = async (
  holdings: PortfolioItem[],
  marketData: MarketData
): Promise<HoldingAnalysis[]> => {
  if (holdings.length === 0) return [];

  const uniqueHoldings = Array.from(new Set(holdings.map((h) => h.symbol))).map(
    (symbol) => {
      const h = holdings.find((i) => i.symbol === symbol);
      const data = marketData[symbol];
      return {
        symbol,
        avgCost: h ? h.avgCost : 0,
        currentPrice: data ? data.price : h
          ? h.avgCost
          : 0
      };
    }
  );

  const prompt = `Analyze holdings using technical indicators. Provide BUY/SELL/HOLD, target.
  Holdings: ${uniqueHoldings
    .map((h) => `${h.symbol}: Cost ${h.avgCost}`)
    .join("; ")}`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              action: { type: Type.STRING, enum: ["BUY", "HOLD", "SELL"] },
              reason: { type: Type.STRING },
              targetPrice: { type: Type.NUMBER },
              dividendYield: { type: Type.STRING },
              cagr: { type: Type.STRING }
            },
            required: [
              "symbol",
              "action",
              "reason",
              "targetPrice",
              "dividendYield",
              "cagr"
            ]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as HoldingAnalysis[];
    }
    return [];
  } catch (e) {
    console.error("analyzeHoldings failed:", e);
    return [];
  }
};
