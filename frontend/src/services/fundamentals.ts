import axios from "axios";
import { API_BASE_URL } from "../config";
import type {
  FundamentalsRaw,
  FinancialStatementYear,
} from "../types";

export async function fetchFundamentalsOverview(
  symbol: string
): Promise<FundamentalsRaw> {
  const url = `${API_BASE_URL}/fundamentals/${encodeURIComponent(symbol)}`;

  const response = await axios.get(url);
  const data = response.data;

  const metric = data?.metric;
  if (!metric) {
    throw new Error("No fundamentals data found.");
  }

  const fundamentals: FundamentalsRaw = {
    symbol,
    Name: symbol,

    MarketCapitalization:
      metric.marketCapitalization != null
        ? String(metric.marketCapitalization)
        : undefined,

    PERatio:
      metric.peAnnual != null
        ? String(metric.peAnnual)
        : undefined,

    PEGRatio:
      metric.pegTTM != null ? String(metric.pegTTM) : undefined,

    PriceToBookRatio:
      metric.pb != null ? String(metric.pb) : undefined,

    ReturnOnEquityTTM:
      metric.roeTTM != null ? String(metric.roeTTM) : undefined,

    ProfitMargin:
      metric.netProfitMarginAnnual != null
        ? String(metric.netProfitMarginAnnual)
        : undefined,

    EPS:
      metric.epsAnnual != null ? String(metric.epsAnnual) : undefined,

    EBITDA:
      metric.ebitdPerShareAnnual != null
        ? String(metric.ebitdPerShareAnnual)
        : undefined,
  };

  return fundamentals;
}

// We are not yet using multi-year revenue/netIncome/etc. from Finnhub,
// so keep these as empty arrays and let deriveFundamentals handle missing data.
export async function fetchIncomeStatement(
  _symbol: string
): Promise<FinancialStatementYear[]> {
  return [];
}

export async function fetchBalanceSheet(
  _symbol: string
): Promise<FinancialStatementYear[]> {
  return [];
}

export async function fetchCashFlow(
  _symbol: string
): Promise<FinancialStatementYear[]> {
  return [];
}
