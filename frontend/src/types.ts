export type Market = "US" | "IN";

export interface Candle {
  date: string;      // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FundamentalsRaw {
  symbol: string;
  Name?: string;
  MarketCapitalization?: string;
  PERatio?: string;
  PEGRatio?: string;
  PriceToBookRatio?: string;
  ReturnOnEquityTTM?: string;
  ProfitMargin?: string;
  EBITDA?: string;
  EPS?: string;
}

export interface FinancialStatementYear {
  fiscalDateEnding: string;
  totalRevenue?: number;
  netIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  totalShareholderEquity?: number;
  operatingCashflow?: number;
}

export interface FundamentalsDerived {
  symbol: string;
  name: string;
  marketCap?: number;
  pe?: number;
  peg?: number;
  pb?: number;
  roe?: number;
  roce?: number | null;
  profitMargin?: number;
  revenueCagr5y?: number | null;
  netIncomeCagr5y?: number | null;
  moatComment: string;
}

export interface TAResult {
  symbol: string;
  lastClose: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  trend: "Uptrend" | "Downtrend" | "Sideways" | "Unknown";
  signal: "Bullish" | "Bearish" | "Neutral";
  reasons: string[];
}

export interface BacktestResult {
  symbol: string;
  totalReturn: number;
  cagr: number;
  maxDrawdown: number;
  winRate: number;
  numTrades: number;
  sharpeApprox: number | null;
  comment: string;
}
