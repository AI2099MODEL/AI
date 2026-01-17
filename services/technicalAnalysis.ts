
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

export const calculateStochastic = (candles: Candle[], period: number = 14): { k: number; d: number } => {
    if (candles.length < period) return { k: 50, d: 50 };
    
    const kValues: number[] = [];
    for (let i = Math.max(0, candles.length - period - 3); i < candles.length; i++) {
        const slice = candles.slice(Math.max(0, i - period + 1), i + 1);
        const low = Math.min(...slice.map(c => c.low));
        const high = Math.max(...slice.map(c => c.high));
        const currentClose = slice[slice.length - 1].close;
        const k = high === low ? 50 : ((currentClose - low) / (high - low)) * 100;
        kValues.push(k);
    }
    
    const k = kValues[kValues.length - 1];
    const d = kValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
    
    return { k, d };
};

export const calculateSupertrend = (candles: Candle[], period: number = 10, multiplier: number = 3): { value: number; trend: 'BUY' | 'SELL' } => {
    if (candles.length < period + 1) return { value: 0, trend: 'SELL' };
    
    const atrValue = calculateATR(candles, period);
    const lookback = Math.min(candles.length - 1, period * 2);
    
    let prevFinalUpper = 0;
    let prevFinalLower = 0;
    let prevSupertrend = 0;

    for (let i = candles.length - lookback; i < candles.length; i++) {
        const c = candles[i];
        const prevC = candles[i-1];
        const basicUpper = (c.high + c.low) / 2 + multiplier * atrValue;
        const basicLower = (c.high + c.low) / 2 - multiplier * atrValue;

        const currentFinalUpper = (basicUpper < prevFinalUpper || prevC.close > prevFinalUpper) ? basicUpper : prevFinalUpper;
        const currentFinalLower = (basicLower > prevFinalLower || prevC.close < prevFinalLower) ? basicLower : prevFinalLower;

        let currentSupertrend = (prevSupertrend === prevFinalUpper) 
            ? (c.close > currentFinalUpper ? currentFinalLower : currentFinalUpper)
            : (c.close < currentFinalLower ? currentFinalUpper : currentFinalLower);

        prevSupertrend = currentSupertrend;
        prevFinalUpper = currentFinalUpper;
        prevFinalLower = currentFinalLower;
    }

    const trend = candles[candles.length - 1].close > prevSupertrend ? 'BUY' : 'SELL';
    return { value: prevSupertrend, trend };
};

export const calculateMACD = (closes: number[]): { macd: number; signal: number; histogram: number } => {
    const ema12 = calcEMA(closes, 12);
    const ema26 = calcEMA(closes, 26);
    const macdLine = ema12.map((val, i) => val - ema26[i]);
    const signalLine = calcEMA(macdLine, 9);
    
    const macd = macdLine[macdLine.length - 1];
    const signal = signalLine[signalLine.length - 1];
    return {
        macd,
        signal,
        histogram: macd - signal
    };
};

export const analyzeStockTechnical = (candles: Candle[]): TechnicalSignals => {
  if (candles.length < 30) {
      return { 
          rsi: 50, macd: {macd:0, signal:0, histogram:0}, stoch: {k:50, d:50}, 
          adx: 0, atr: 0, bollinger: {upper:0, middle:0, lower:0, percentB:0}, 
          ema: {ema9:0, ema21:0}, supertrend: {value: 0, trend: 'SELL'},
          obv: 0, score: 0, activeSignals: [], signalStrength: 'HOLD', rvol: 1
      };
  }

  const closes = getCloses(candles);
  const lastPrice = closes[closes.length - 1];
  
  const rsi = calculateRSI(candles);
  const adx = calculateADX(candles);
  const atr = calculateATR(candles);
  const macd = calculateMACD(closes);
  const supertrend = calculateSupertrend(candles);
  const stoch = calculateStochastic(candles);
  
  const ema9Arr = calcEMA(closes, 9);
  const ema21Arr = calcEMA(closes, 21);
  const ema9 = ema9Arr[ema9Arr.length - 1];
  const ema21 = ema21Arr[ema21Arr.length - 1];
  
  const sma20 = calcSMA(closes, 20);
  const stdDev = calcStdDev(closes, 20);
  const upperBB = sma20 + (stdDev * 2);
  const lowerBB = sma20 - (stdDev * 2);
  const bbWidth = (upperBB - lowerBB) / sma20;
  
  const volumes = candles.map(c => c.volume);
  const avgVol = calcSMA(volumes, 20);
  const rvol = volumes[volumes.length - 1] / (avgVol || 1);

  const activeSignals: string[] = [];
  let score = 0;

  if (lastPrice > ema9 && ema9 > ema21) {
      score += 20;
      activeSignals.push("EMA Bull Stack");
  }

  if (lastPrice > upperBB) {
      score += 25;
      activeSignals.push("BB Breakout");
  }

  if (rvol > 2.0) {
      score += 20;
      activeSignals.push("High Volume Pulse");
  }

  if (adx > 25) {
      score += 15;
      activeSignals.push("Strong Trend (ADX)");
  }

  if (supertrend.trend === 'BUY') {
      score += 15;
      activeSignals.push("Supertrend Buy");
  }

  if (macd.histogram > 0) {
      score += 10;
      activeSignals.push("MACD Bullish");
  }

  if (stoch.k < 20) {
      score += 10;
      activeSignals.push("Stoch Oversold");
  }

  const finalScore = Math.min(100, score);
  let strength: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
  
  if (finalScore >= 75) strength = 'STRONG BUY';
  else if (finalScore >= 55) strength = 'BUY';
  else if (finalScore <= 25) strength = 'SELL';

  return { 
      rsi, adx, atr, score: finalScore, activeSignals, signalStrength: strength,
      macd, stoch,
      bollinger: {upper: upperBB, middle: sma20, lower: lowerBB, percentB: (lastPrice - lowerBB) / (upperBB - lowerBB)},
      ema: {ema9, ema21}, supertrend, obv: 0, rvol
  };
};
