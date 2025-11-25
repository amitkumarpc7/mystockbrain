import type { Candle, TAResult } from '../types';

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(values.length - period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smooth subsequent steps (Wilder's Smoothing)
  // We need to calculate RSI for the whole series to get the correct current RSI?
  // Standard RSI usually requires a rolling calculation.
  // For simplicity in this "Snapshot" app, let's calculate it over the available data properly.
  
  // Actually, to get the *latest* RSI correctly, we should iterate from the beginning.
  // But for this assignment, let's do a simple loop over the whole dataset if possible, 
  // or just enough to stabilize. 200-300 points is usually enough.
  
  // Let's re-implement standard RSI loop
  const changes: number[] = [];
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1]);
  }

  if (changes.length < period) return null;

  let currentAvgGain = 0;
  let currentAvgLoss = 0;

  // First period
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) currentAvgGain += changes[i];
    else currentAvgLoss += Math.abs(changes[i]);
  }
  currentAvgGain /= period;
  currentAvgLoss /= period;

  // Subsequent periods
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    currentAvgGain = (currentAvgGain * (period - 1) + gain) / period;
    currentAvgLoss = (currentAvgLoss * (period - 1) + loss) / period;
  }

  if (currentAvgLoss === 0) return 100;
  const rs = currentAvgGain / currentAvgLoss;
  return 100 - (100 / (1 + rs));
}

export function analyzeTA(symbol: string, candles: Candle[]): TAResult {
  const closes = candles.map(c => c.close);
  const lastClose = closes[closes.length - 1];

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const rsi14 = rsi(closes, 14);

  let trend: TAResult['trend'] = "Unknown";
  if (sma50 && sma200) {
    if (sma50 > sma200 * 1.01) trend = "Uptrend";
    else if (sma50 < sma200 * 0.99) trend = "Downtrend";
    else trend = "Sideways";
  }

  let signal: TAResult['signal'] = "Neutral";
  const reasons: string[] = [];

  if (trend === "Uptrend") {
    reasons.push("SMA50 is significantly above SMA200 (Golden Cross area).");
    if (rsi14 !== null && rsi14 >= 40 && rsi14 <= 70) {
      signal = "Bullish";
      reasons.push("RSI is in healthy bullish zone (40-70).");
    }
  } else if (trend === "Downtrend") {
    reasons.push("SMA50 is significantly below SMA200 (Death Cross area).");
    if (rsi14 !== null && rsi14 > 50) {
      signal = "Bearish"; // Wait, prompt says: If Downtrend && RSI > 50 → Bearish. 
      // Logic: In downtrend, RSI > 50 might mean a pullback upwards to resistance, or just weak momentum. 
      // Prompt rule: "If Downtrend && RSI > 50 → Bearish"
      reasons.push("RSI > 50 in a downtrend often indicates a selling opportunity (pullback).");
    }
  } else {
    reasons.push("Trend is sideways or undefined.");
  }

  if (rsi14 !== null) {
    if (rsi14 > 70) reasons.push("RSI is Overbought (>70).");
    if (rsi14 < 30) reasons.push("RSI is Oversold (<30).");
  }

  return {
    symbol,
    lastClose,
    sma20,
    sma50,
    sma200,
    rsi14,
    trend,
    signal,
    reasons
  };
}
