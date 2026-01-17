
import { Candle, TechnicalSignals } from "../types";

// --- Advanced Math Helpers ---
const getCloses = (candles: Candle[]) => candles.map(c => c.close);
const getHighs = (candles: Candle[]) => candles.map(c => c.high);
const getLows = (candles: Candle[]) => candles.map(c => c.low);

const calcSMA = (data: number[], period: number): number => {
  if (data.length < period) return data[data.length - 1];
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
};

const calcEMA = (data: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const emaArray = [data[0]];
  for (let i = 1; i < data.length; i++) {
    emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
};

// --- Professional Grade Indicators ---

export const calculateADX = (candles: Candle[], period: number = 14): number => {
    if (candles.length < period * 2) return 20;
    
    let plusDM = 0, minusDM = 0, tr = 0;
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

// --- Advanced Engine Logic ---

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
  
  // 1. Core Indicators
  const rsi = calculateRSI(candles);
  const adx = calculateADX(candles);
  const atr = calculateATR(candles);
  
  // 2. Trend & Volume Metrics
  const ema9Series = calcEMA(closes, 9);
  const ema21Series = calcEMA(closes, 21);
  const ema9 = ema9Series[ema9Series.length - 1];
  const ema21 = ema21Series[ema21Series.length - 1];
  
  const volumes = candles.map(c => c.volume);
  const avgVol = calcSMA(volumes, 20);
  const rvol = volumes[volumes.length - 1] / (avgVol || 1);

  // 3. VWAP Approximation
  let cumulativePV = 0, cumulativeV = 0;
  candles.slice(-20).forEach(c => {
      cumulativePV += ((c.high + c.low + c.close) / 3) * c.volume;
      cumulativeV += c.volume;
  });
  const vwap = cumulativeV > 0 ? cumulativePV / cumulativeV : lastPrice;

  // 4. Scoring Engine (Strategy-First)
  const activeSignals: string[] = [];
  let score = 0;

  // A. The Anchor: VWAP Logic
  if (lastPrice > vwap) {
      score += 25;
      activeSignals.push("Price Anchor (VWAP+)");
  }

  // B. The Fuel: Institutional RVOL Logic
  if (rvol > 2.5) {
      score += 35;
      activeSignals.push("Institutional Pulse (RVOL 2.5+)");
  } else if (rvol > 1.5) {
      score += 15;
      activeSignals.push("Volume Expansion");
  }

  // C. The Trend: ADX Strength
  if (adx > 25) {
      score += 20;
      activeSignals.push("Strong Trend (ADX)");
      if (ema9 > ema21) score += 10;
  }

  // D. Momentum: RSI Crossover
  if (rsi > 55 && rsi < 75) {
      score += 15;
      activeSignals.push("Bullish Momentum");
  } else if (rsi < 30) {
      score += 20; // Oversold Mean Reversion
      activeSignals.push("Mean Reversion (Oversold)");
  }

  let strength: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
  const finalScore = Math.min(100, score);
  
  if (finalScore >= 80) strength = 'STRONG BUY';
  else if (finalScore >= 60) strength = 'BUY';
  else if (finalScore <= 30) strength = 'SELL';

  return { 
      rsi, adx, atr, score: finalScore, activeSignals, signalStrength: strength,
      macd: {macd:0, signal:0, histogram:0}, stoch: {k:50, d:50},
      bollinger: {upper:0, middle:0, lower:0, percentB:0},
      ema: {ema9, ema21}, obv: 0
  };
};
