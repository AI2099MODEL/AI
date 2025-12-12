import { Candle, TechnicalSignals } from '../types';

// ---------- Basic helpers ----------

const getCloses = (candles: Candle[]) => candles.map((c) => c.close);
const getHighs = (candles: Candle[]) => candles.map((c) => c.high);
const getLows = (candles: Candle[]) => candles.map((c) => c.low);
const getVolumes = (candles: Candle[]) => candles.map((c) => c.volume);

const calcSMA = (data: number[], period: number): number => {
  if (!data.length) return 0;
  if (data.length < period) {
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length;
  }
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

const calcEMAArray = (data: number[], period: number): number[] => {
  if (!data.length) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
};

const calcStdDev = (data: number[], period: number): number => {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance =
    slice.reduce((a, b) => a + (b - mean) * (b - mean), 0) / period;
  return Math.sqrt(variance);
};

// ---------- Indicator calculations ----------

// RSI (Wilder style)
export const calculateRSI = (candles: Candle[], period: number = 14): number => {
  if (candles.length < period + 1) return 50;

  const closes = getCloses(candles);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += -diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

// MACD (12/26/9)
export const calculateMACD = (candles: Candle[]) => {
  const closes = getCloses(candles);
  if (closes.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const ema12 = calcEMAArray(closes, 12);
  const ema26 = calcEMAArray(closes, 26);
  const len = Math.min(ema12.length, ema26.length);

  const macdLine: number[] = [];
  for (let i = 0; i < len; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }

  const signalLine = calcEMAArray(macdLine, 9);
  const macd = macdLine[macdLine.length - 1] ?? 0;
  const signal = signalLine[signalLine.length - 1] ?? 0;
  const histogram = macd - signal;

  return { macd, signal, histogram };
};

// Bollinger Bands + %B
export const calculateBollinger = (candles: Candle[], period: number = 20) => {
  const closes = getCloses(candles);
  if (closes.length < period) {
    return { upper: 0, middle: 0, lower: 0, percentB: 0, bandwidthPct: 0 };
  }

  const middle = calcSMA(closes, period);
  const stdDev = calcStdDev(closes, period);
  const upper = middle + 2 * stdDev;
  const lower = middle - 2 * stdDev;
  const current = closes[closes.length - 1];
  const range = upper - lower || 1;
  const percentB = (current - lower) / range;
  const bandwidthPct = upper && current
    ? ((upper - lower) / current) * 100
    : 0;

  return { upper, middle, lower, percentB, bandwidthPct };
};

// Stochastic %K, %D (14, 3)
export const calculateStochastic = (candles: Candle[], period: number = 14) => {
  if (candles.length < period + 2) {
    return { k: 50, d: 50 };
  }
  const highs = getHighs(candles);
  const lows = getLows(candles);
  const closes = getCloses(candles);

  const kValues: number[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const hSlice = highs.slice(i - period + 1, i + 1);
    const lSlice = lows.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...hSlice);
    const lowestLow = Math.min(...lSlice);
    const close = closes[i];

    const denom = highestHigh - lowestLow || 1;
    const k = ((close - lowestLow) / denom) * 100;
    kValues.push(k);
  }

  const k = kValues[kValues.length - 1];
  const d =
    kValues.length >= 3
      ? calcSMA(kValues.slice(-3), 3)
      : k;

  return { k, d };
};

// Wilder-style ADX + DI
export const calculateADXWithDI = (
  candles: Candle[],
  period: number = 14
): { adx: number; plusDI: number; minusDI: number } => {
  if (candles.length < period + 2) {
    return { adx: 20, plusDI: 0, minusDI: 0 };
  }

  const highs = getHighs(candles);
  const lows = getLows(candles);
  const closes = getCloses(candles);

  const trs: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    const highLow = highs[i] - lows[i];
    const highPrevClose = Math.abs(highs[i] - closes[i - 1]);
    const lowPrevClose = Math.abs(lows[i] - closes[i - 1]);
    const tr = Math.max(highLow, highPrevClose, lowPrevClose);
    trs.push(tr);

    let plus = 0;
    let minus = 0;
    if (upMove > downMove && upMove > 0) plus = upMove;
    if (downMove > upMove && downMove > 0) minus = downMove;

    plusDM.push(plus);
    minusDM.push(minus);
  }

  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0);
  let smPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  const dxArray: number[] = [];
  let lastPlusDI = 0;
  let lastMinusDI = 0;

  for (let i = period; i < trs.length; i++) {
    atr = atr - atr / period + trs[i];
    smPlusDM = smPlusDM - smPlusDM / period + plusDM[i];
    smMinusDM = smMinusDM - smMinusDM / period + minusDM[i];

    const plusDI = atr ? (smPlusDM / atr) * 100 : 0;
    const minusDI = atr ? (smMinusDM / atr) * 100 : 0;
    const sumDI = plusDI + minusDI || 1;
    const dx = (Math.abs(plusDI - minusDI) / sumDI) * 100;
    dxArray.push(dx);
    lastPlusDI = plusDI;
    lastMinusDI = minusDI;
  }

  if (!dxArray.length) {
    return { adx: 20, plusDI: lastPlusDI, minusDI: lastMinusDI };
  }

  let adx =
    dxArray.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dxArray.length; i++) {
    adx = ((adx * (period - 1)) + dxArray[i]) / period;
  }

  return { adx, plusDI: lastPlusDI, minusDI: lastMinusDI };
};

// ATR (14)
export const calculateATR = (candles: Candle[], period: number = 14): number => {
  if (candles.length < period + 1) return 0;

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high;
    const l = candles[i].low;
    const pc = candles[i - 1].close;

    const tr = Math.max(
      h - l,
      Math.abs(h - pc),
      Math.abs(l - pc)
    );
    trs.push(tr);
  }

  return calcSMA(trs, period);
};

// EMA 9 / 21
export const calculateEMA_Crossover = (candles: Candle[]) => {
  const closes = getCloses(candles);
  if (closes.length < 50) {
    return { ema9: 0, ema21: 0, crossedUp: false };
  }
  const ema9Arr = calcEMAArray(closes, 9);
  const ema21Arr = calcEMAArray(closes, 21);

  const ema9 = ema9Arr[ema9Arr.length - 1] ?? 0;
  const ema21 = ema21Arr[ema21Arr.length - 1] ?? 0;
  const ema9Prev = ema9Arr[ema9Arr.length - 2] ?? ema9;
  const ema21Prev = ema21Arr[ema21Arr.length - 2] ?? ema21;

  const crossedUp =
    ema9 > ema21 && ema9Prev <= ema21Prev;

  return { ema9, ema21, crossedUp };
};

// OBV series
export const calculateOBVData = (candles: Candle[]): number[] => {
  if (!candles.length) return [];
  const obv: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    let currentOBV = obv[i - 1];
    if (candles[i].close > candles[i - 1].close) {
      currentOBV += candles[i].volume;
    } else if (candles[i].close < candles[i - 1].close) {
      currentOBV -= candles[i].volume;
    }
    obv.push(currentOBV);
  }
  return obv;
};

// ---------- Main scoring (mirrors Python algo) ----------

export const analyzeStockTechnical = (candles: Candle[]): TechnicalSignals => {
  if (candles.length < 2) {
    return {
      rsi: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      stoch: { k: 50, d: 50 },
      adx: 0,
      atr: 0,
      bollinger: { upper: 0, middle: 0, lower: 0, percentB: 0, bandwidthPct: 0 },
      ema: { ema9: 0, ema21: 0, crossedUp: false },
      obv: 0,
      score: 0,
      activeSignals: [],
      reasons: [],
      signalStrength: 'HOLD',
    };
  }

  const closes = getCloses(candles);
  const volumes = getVolumes(candles);

  const rsi = calculateRSI(candles);                              // Python rsi_signal [file:87]
  const macd = calculateMACD(candles);                            // macd_signal [file:87]
  const stoch = calculateStochastic(candles);                     // stochastic_signal [file:87]
  const boll = calculateBollinger(candles);                       // bollinger_squeeze [file:87]
  const { adx, plusDI, minusDI } = calculateADXWithDI(candles);   // adx_trend_strength [file:87]
  const atr = calculateATR(candles);                              // calculate_targets ATR [file:87]
  const ema = calculateEMA_Crossover(candles);                    // ema_crossover [file:87]
  const obvSeries = calculateOBVData(candles);                    // obv_divergence [file:87]

  const currentOBV = obvSeries[obvSeries.length - 1] ?? 0;
  const obvSMA10 = calcSMA(obvSeries, 10);

  const avgVol20 = calcSMA(volumes, 20);
  const curVol = volumes[volumes.length - 1] ?? 0;

  const prevClose = closes[closes.length - 2] ?? 0;
  const lastClose = closes[closes.length - 1] ?? 0;
  const priceChangePct =
    prevClose > 0 ? ((lastClose - prevClose) / prevClose) * 100 : 0;

  let score = 0;
  const activeSignals: string[] = [];
  const reasons: string[] = [];

  // --- RSI signal (rsi_signal) [file:87]
  if (closes.length >= 15) {
    if (rsi < 30) {
      score += 35;
      activeSignals.push('RSI');
      reasons.push(`RSI Oversold (${rsi.toFixed(1)})`);
    } else if (rsi < 40) {
      score += 25;
      activeSignals.push('RSI');
      reasons.push(`RSI Strong Buy Zone (${rsi.toFixed(1)})`);
    }
  }

  // --- MACD signal (macd_signal) [file:87]
  if (closes.length >= 35) {
    if (macd.macd > macd.signal && macd.histogram > 0) {
      score += 30;
      activeSignals.push('MACD');
      reasons.push('MACD Bullish Crossover');
    }
  }

  // --- Stochastic (stochastic_signal) [file:87]
  if (closes.length >= 14) {
    if (stoch.k < 20 && stoch.k > stoch.d) {
      score += 25;
      activeSignals.push('Stochastic');
      reasons.push('Stochastic Oversold Reversal');
    }
  }

  // --- ADX trend strength (adx_trend_strength) [file:87]
  if (closes.length >= 25) {
    if (adx > 25 && plusDI > minusDI) {
      score += 30;
      activeSignals.push('ADX');
      reasons.push(`Strong Uptrend (ADX: ${adx.toFixed(1)})`);
    }
  }

  // --- Bollinger squeeze (bollinger_squeeze) [file:87]
  if (closes.length >= 20) {
    const price = lastClose;
    const priceCond = price < boll.lower * 1.02;
    const bw = boll.bandwidthPct;
    if (priceCond && bw < 10) {
      score += 25;
      activeSignals.push('Bollinger');
      reasons.push('BB Squeeze Breakout Setup');
    }
  }

  // --- Volume + price confirmation (volume_price_confirmation) [file:87]
  if (volumes.length >= 20 && closes.length >= 2) {
    if (curVol > avgVol20 * 1.5 && priceChangePct > 1) {
      score += 30;
      activeSignals.push('Volume');
      reasons.push(`Volume Spike with Price Up (${priceChangePct.toFixed(1)}%)`);
    }
  }

  // --- EMA 9/21 Golden Cross (ema_crossover) [file:87]
  if (ema.crossedUp) {
    score += 28;
    activeSignals.push('EMA');
    reasons.push('EMA 9/21 Golden Cross');
  }

  // --- OBV accumulation (obv_divergence) [file:87]
  if (obvSeries.length >= 20) {
    if (currentOBV > obvSMA10) {
      score += 22;
      activeSignals.push('OBV');
      reasons.push('OBV Accumulation Phase');
    }
  }

  // Strength mapping (same as analyze_stock) [file:87]
  let signalStrength: 'STRONG BUY' | 'BUY' | 'HOLD' = 'HOLD';
  if (score >= 90) signalStrength = 'STRONG BUY';
  else if (score >= 60) signalStrength = 'BUY';

  return {
    rsi,
    macd,
    stoch,
    adx,
    atr,
    bollinger: boll,
    ema,
    obv: currentOBV,
    score,
    activeSignals,
    reasons,
    signalStrength,
  };
};
