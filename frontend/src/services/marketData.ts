import axios from "axios";
import type { Candle, Market } from "../types";
import { API_BASE_URL } from "../config";

export async function fetchDailyCandles(
  symbol: string,
  _market: Market
): Promise<Candle[]> {
  const url = `${API_BASE_URL}/candles/${encodeURIComponent(symbol)}`;
  // Backend might ignore these params if it's just proxying, but good to keep if backend supports it later
  // or if we need to pass them to the backend to pass to Yahoo.
  // Based on user request, backend just exposes /api/candles/:symbol
  // We'll assume the backend handles the range/interval defaults or we can pass them if needed.
  // The user example didn't show query params, but standard Yahoo often takes them.
  // We'll send them just in case the backend forwards them, or ignore if not.
  // Actually, the user prompt says: "GET http://localhost:4000/api/candles/:symbol"
  // It doesn't explicitly say it accepts query params, but it's safer to just call the URL as requested.

  try {
    const response = await axios.get(url);
    const data = response.data;

    const result = data?.chart?.result?.[0];
    const error = data?.chart?.error;

    if (error || !result) {
      throw new Error(error?.description || "No market data found for this symbol.");
    }

    const timestamps: number[] = result.timestamp;
    const quote = result.indicators?.quote?.[0];

    if (!timestamps || !quote) {
      throw new Error("Invalid candle data format.");
    }

    const { open, high, low, close, volume } = quote;

    const candles: Candle[] = timestamps
      .map((ts, i) => {
        const o = open?.[i];
        const h = high?.[i];
        const l = low?.[i];
        const c = close?.[i];
        const v = volume?.[i];

        if (
          o == null ||
          h == null ||
          l == null ||
          c == null ||
          v == null
        ) {
          return null;
        }

        return {
          date: new Date(ts * 1000).toISOString().slice(0, 10),
          open: Number(o),
          high: Number(h),
          low: Number(l),
          close: Number(c),
          volume: Number(v),
        } as Candle;
      })
      .filter((c): c is Candle => !!c && !Number.isNaN(c.close));

    candles.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (!candles.length) {
      throw new Error("No valid candle data returned.");
    }

    return candles;
  } catch (error: any) {
    console.error("Error fetching candles via API:", error?.response?.data || error);
    throw new Error(error?.message || "Failed to fetch market data.");
  }
}
