import axios from "axios";
import type { Candle, Market } from "../types";

// Yahoo Finance chart endpoint works for US + NSE/BSE tickers like RELIANCE.NS
const YAHOO_CHART_BASE_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart";

export async function fetchDailyCandles(
  symbol: string,
  _market: Market
): Promise<Candle[]> {
  // _market kept for future provider routing, not used for Yahoo
  const url = `${YAHOO_CHART_BASE_URL}/${encodeURIComponent(symbol)}`;

  const params = {
    range: "5y", // last 5 years of data
    interval: "1d", // daily candles
  };

  try {
    const response = await axios.get(url, { params });
    const data = response.data;

    const result = data?.chart?.result?.[0];
    const error = data?.chart?.error;

    if (error || !result) {
      throw new Error(
        error?.description || "No market data found for this symbol."
      );
    }

    const timestamps: number[] = result.timestamp;
    const quote = result.indicators?.quote?.[0];

    if (!timestamps || !quote) {
      throw new Error("Invalid data format from Yahoo Finance.");
    }

    const { open, high, low, close, volume } = quote;

    const candles: Candle[] = timestamps
      .map((ts, i) => {
        const o = open?.[i];
        const h = high?.[i];
        const l = low?.[i];
        const c = close?.[i];
        const v = volume?.[i];

        // Skip incomplete rows
        if (o == null || h == null || l == null || c == null || v == null) {
          return null;
        }

        return {
          date: new Date(ts * 1000).toISOString().slice(0, 10), // YYYY-MM-DD
          open: Number(o),
          high: Number(h),
          low: Number(l),
          close: Number(c),
          volume: Number(v),
        } as Candle;
      })
      .filter((c): c is Candle => !!c && !Number.isNaN(c.close));

    // Yahoo already returns oldest → newest for this endpoint, but keep this for safety
    candles.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (!candles.length) {
      throw new Error("No valid candle data returned.");
    }

    return candles;
  } catch (error: any) {
    console.error(
      "Error fetching candles from Yahoo Finance:",
      error?.response?.data || error
    );
    throw new Error(error?.message || "Failed to fetch market data.");
  }
}
