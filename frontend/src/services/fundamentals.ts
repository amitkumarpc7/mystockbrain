import axios from 'axios';
import type { FundamentalsRaw, FinancialStatementYear } from '../types';
import { ALPHA_VANTAGE_API_KEY, ALPHA_VANTAGE_BASE_URL } from '../config';

async function fetchAlphaVantage(functionName: string, symbol: string) {
  const params = {
    function: functionName,
    symbol: symbol,
    apikey: ALPHA_VANTAGE_API_KEY,
  };
  const response = await axios.get(ALPHA_VANTAGE_BASE_URL, { params });
  if (response.data['Note']) {
    throw new Error("API rate limit reached.");
  }
  return response.data;
}

export async function fetchFundamentalsOverview(symbol: string): Promise<FundamentalsRaw> {
  const data = await fetchAlphaVantage('OVERVIEW', symbol);
  if (!data || Object.keys(data).length === 0) {
    // Return empty object or throw? Prompt implies we need to show data.
    // If empty, it might be invalid symbol or no data.
    return { symbol };
  }
  return { ...data, symbol };
}

export async function fetchIncomeStatement(symbol: string): Promise<FinancialStatementYear[]> {
  const data = await fetchAlphaVantage('INCOME_STATEMENT', symbol);
  return parseReports(data.annualReports);
}

export async function fetchBalanceSheet(symbol: string): Promise<FinancialStatementYear[]> {
  const data = await fetchAlphaVantage('BALANCE_SHEET', symbol);
  return parseReports(data.annualReports);
}

export async function fetchCashFlow(symbol: string): Promise<FinancialStatementYear[]> {
  const data = await fetchAlphaVantage('CASH_FLOW', symbol);
  return parseReports(data.annualReports);
}

function parseReports(reports: any[]): FinancialStatementYear[] {
  if (!reports || !Array.isArray(reports)) return [];
  return reports.map((r: any) => ({
    fiscalDateEnding: r.fiscalDateEnding,
    totalRevenue: parseFloat(r.totalRevenue || r.totalRevenue), // API field names vary slightly sometimes
    netIncome: parseFloat(r.netIncome),
    totalAssets: parseFloat(r.totalAssets),
    totalLiabilities: parseFloat(r.totalLiabilities),
    totalShareholderEquity: parseFloat(r.totalShareholderEquity),
    operatingCashflow: parseFloat(r.operatingCashflow),
  }));
}
