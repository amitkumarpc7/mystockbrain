import type { Candle, BacktestResult } from '../types';

function calculateSma(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      result.push(sum / period);
    } else {
      result.push(null);
    }
  }
  return result;
}

export function backtestSmaCrossover(symbol: string, candles: Candle[]): BacktestResult {
  const closes = candles.map(c => c.close);
  const sma50 = calculateSma(closes, 50);
  const sma200 = calculateSma(closes, 200);

  let equity = 1.0;
  let position = 0; // 0 = cash, 1 = long
  let numTrades = 0;
  let wins = 0;
  
  // We need daily returns for Sharpe
  const dailyReturns: number[] = [];
  
  // Start loop where both SMAs are available
  const startIndex = 200; 

  for (let i = startIndex; i < candles.length; i++) {
    const s50 = sma50[i];
    const s200 = sma200[i];
    const prevS50 = sma50[i-1];
    const prevS200 = sma200[i-1];

    if (s50 === null || s200 === null || prevS50 === null || prevS200 === null) continue;

    // Daily return calculation
    let todayReturn = 0;
    if (position === 1) {
      const priceToday = closes[i];
      const priceYesterday = closes[i-1];
      todayReturn = (priceToday - priceYesterday) / priceYesterday;
      equity *= (1 + todayReturn);
    }
    dailyReturns.push(todayReturn);

    // Crossover Logic
    const crossOverUp = prevS50 <= prevS200 && s50 > s200;
    const crossOverDown = prevS50 >= prevS200 && s50 < s200;

    if (crossOverUp && position === 0) {
      // Buy
      position = 1;
      numTrades++;
    } else if (crossOverDown && position === 1) {
      // Sell
      position = 0;
      // Check if this trade was a win? 
      // Hard to track individual trade PnL easily without storing entry price. 
      // But we can approximate win rate by checking if equity increased since entry?
      // Let's just count "wins" as trades that ended with positive return?
      // Actually, let's track entry price for win rate calculation.
    }
  }

  // To calculate win rate properly, we need to track individual trades.
  // Let's re-run loop with trade tracking.
  equity = 1.0;
  position = 0;
  numTrades = 0;
  wins = 0;
  let entryPrice = 0;
  let maxEquity = 1.0;
  let maxDrawdown = 0;

  for (let i = startIndex; i < candles.length; i++) {
    const s50 = sma50[i];
    const s200 = sma200[i];
    const prevS50 = sma50[i-1];
    const prevS200 = sma200[i-1];

    if (s50 === null || s200 === null || prevS50 === null || prevS200 === null) continue;

    // Update Equity
    if (position === 1) {
      const priceToday = closes[i];
      const priceYesterday = closes[i-1];
      const change = (priceToday - priceYesterday) / priceYesterday;
      equity *= (1 + change);
    }

    // Max Drawdown Tracking
    if (equity > maxEquity) maxEquity = equity;
    const drawdown = (maxEquity - equity) / maxEquity;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    // Signals
    const crossOverUp = prevS50 <= prevS200 && s50 > s200;
    const crossOverDown = prevS50 >= prevS200 && s50 < s200;

    if (crossOverUp && position === 0) {
      position = 1;
      entryPrice = closes[i];
      numTrades++;
    } else if (crossOverDown && position === 1) {
      position = 0;
      const exitPrice = closes[i];
      if (exitPrice > entryPrice) wins++;
    }
  }

  const totalReturn = (equity - 1) * 100;
  
  // CAGR
  const startDate = new Date(candles[startIndex].date);
  const endDate = new Date(candles[candles.length - 1].date);
  const years = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 365);
  const cagrVal = years > 0 ? (Math.pow(equity, 1 / years) - 1) * 100 : 0;

  const winRate = numTrades > 0 ? (wins / numTrades) * 100 : 0;

  // Sharpe Approx
  // Avg daily return / StdDev daily return * sqrt(252)
  const meanReturn = dailyReturns.reduce((a,b) => a+b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((a,b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeApprox = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  const comment = cagrVal > 0 
    ? "Strategy historically profitable (before costs)." 
    : "Strategy historically weak or losing (before costs).";

  return {
    symbol,
    totalReturn,
    cagr: cagrVal,
    maxDrawdown: maxDrawdown * 100,
    winRate,
    numTrades,
    sharpeApprox,
    comment
  };
}
