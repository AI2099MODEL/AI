
import { Candle, TechnicalSignals } from "../types";

// --- Quantitative Math Helpers ---
const getCloses = (candles: Candle[]) => candles.map(c => c.close);
const getHighs = (candles: Candle[]) => candles.map(c => c.high);
const getLows = (candles: Candle[]) => candles.map(c => c.low);

const calcSMA = (data: number[], period: number): number => {
  if (data.length < period) return data[data.length - 1] || 0;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
};

const calcEMA = (data: number[], period: number): number[] => {
  if (data.length === 0) return [0];
  const k = 2 / (period + 1);
  const emaArray = [data[0]];
  for (let i = 1; i < data.length; i++) {
    emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
};

const calcStdDev = (data: number[], period: number): number => {
  const sma = calcSMA(data, period);
  const variance = data.slice(-period).reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
  return Math.sqrt(variance);
};

// --- Professional Signal Indicators ---

export const calculateADX = (candles: Candle[], period: number = 14): number => {
    if (candles.length < period * 2) return 20;
    
    const trs: number[] = [], plusDMs: number[] = [], minusDMs: number[] = [];

    for (let i = 1; i < candles.length; i++) {
        const upMove = candles[i].high - candles[i-1].high;
        const downMove = candles[i-1].low - candles[i].low;
        
        plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
        minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
        trs.push(Math.max(
            candles[i].high - candles[i].low,
            Math.abs(candles[i].high - candles[i-1].close),
            Math.abs(candles[i].low - candles[i-1].close)
        ));
    }

    const smoothTR = calcSMA(trs, period);
    const smoothPlusDM = calcSMA(plusDMs, period);
    const smoothMinusDM = calcSMA(minusDMs, period);

    const plusDI = (smoothPlusDM / smoothTR) * 100;
    const minusDI = (smoothMinusDM / smoothTR) * 100;
    
    if (plusDI + minusDI === 0) return 0;
    return Math.abs((plusDI - minusDI) / (plusDI + minusDI)) * 100;
};

export const calculateRSI = (candles: Candle[], period: number = 14): number => {
  if (candles.length < period + 1) return 50;
  const closes = getCloses(candles);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
  }
  return avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
};

export const calculateATR = (candles: Candle[], period: number = 14): number => {
    if (candles.length < period + 1) return 0;
    const trs = candles.slice(1).map((c, i) => Math.max(
        c.high - c.low,
        Math.abs(c.high - candles[i].close),
        Math.abs(c.low - candles[i].close)
    ));
    return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
};

export const analyzeStockTechnical = (candles: Candle[]): TechnicalSignals => {
  if (candles.length < 30) {
      return { 
          rsi: 50, macd: {macd:0, signal:0, histogram:0}, stoch: {k:50, d:50}, 
          adx: 0, atr: 0, bollinger: {upper:0, middle:0, lower:0, percentB:0}, 
          ema: {ema9:0, ema21:0}, obv: 0, score: 0, activeSignals: [], signalStrength: 'HOLD' 
      };
  }

  const closes = getCloses(candles);
  const lastPrice = closes[closes.length - 1];
  
  // 1. Core Technicals
  const rsi = calculateRSI(candles);
  const adx = calculateADX(candles);
  const atr = calculateATR(candles);
  
  // 2. Trend Metrics
  const ema9 = calcEMA(closes, 9).pop() || 0;
  const ema21 = calcEMA(closes, 21).pop() || 0;
  
  // 3. Volatility Squeeze (Bollinger Bands)
  const sma20 = calcSMA(closes, 20);
  const stdDev = calcStdDev(closes, 20);
  const upperBB = sma20 + (stdDev * 2);
  const lowerBB = sma20 - (stdDev * 2);
  const bbWidth = (upperBB - lowerBB) / sma20;
  const historicalBBWidth = calcSMA(candles.map((_, i) => {
      const slice = closes.slice(Math.max(0, i - 20), i + 1);
      if (slice.length < 2) return 0;
      const s = slice.reduce((a, b) => a + b, 0) / slice.length;
      const v = slice.reduce((acc, val) => acc + Math.pow(val - s, 2), 0) / slice.length;
      const d = Math.sqrt(v);
      return (d * 4) / s;
  }), 50);

  // 4. Institutional RVOL
  const volumes = candles.map(c => c.volume);
  const avgVol = calcSMA(volumes, 20);
  const rvol = volumes[volumes.length - 1] / (avgVol || 1);

  // 5. Scoring Engine
  const activeSignals: string[] = [];
  let score = 0;

  // Signal A: Trend Alignment
  if (lastPrice > ema9 && ema9 > ema21) {
      score += 20;
      activeSignals.push("Trend Master (9>21)");
  }

  // Signal B: The Volatility Squeeze Breakout
  if (bbWidth > historicalBBWidth * 1.5 && lastPrice > upperBB) {
      score += 30;
      activeSignals.push("Volatility Breakout (BB Squeeze)");
  }

  // Signal C: High Intensity RVOL
  if (rvol > 2.0) {
      score += 25;
      activeSignals.push("Smart Money Burst (RVOL 2+)");
  }

  // Signal D: Trend Strength
  if (adx > 25) {
      score += 15;
      activeSignals.push("High Conviction Trend (ADX)");
  }

  // Signal E: RSI Rebound
  if (rsi > 40 && rsi < 70 && lastPrice > closes[closes.length - 2]) {
      score += 10;
      activeSignals.push("Momentum Push");
  }

  const finalScore = Math.min(100, score);
  let strength: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
  
  if (finalScore >= 75) strength = 'STRONG BUY';
  else if (finalScore >= 55) strength = 'BUY';
  else if (finalScore <= 25) strength = 'SELL';

  return { 
      rsi, adx, atr, score: finalScore, activeSignals, signalStrength: strength,
      macd: {macd:0, signal:0, histogram:0}, stoch: {k:50, d:50},
      bollinger: {upper: upperBB, middle: sma20, lower: lowerBB, percentB: (lastPrice - lowerBB) / (upperBB - lowerBB)},
      ema: {ema9, ema21}, obv: 0
  };
};
