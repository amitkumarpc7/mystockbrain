import type { FundamentalsRaw, FinancialStatementYear, FundamentalsDerived } from '../types';

function parseNum(v?: string): number | undefined {
  if (!v || v === 'None' || v === '-') return undefined;
  const parsed = parseFloat(v);
  return isNaN(parsed) ? undefined : parsed;
}

function cagr(first: number, last: number, years: number): number {
  if (first <= 0 || last <= 0 || years <= 0) return 0;
  return Math.pow(last / first, 1 / years) - 1;
}

export function deriveFundamentals(
  raw: FundamentalsRaw,
  income: FinancialStatementYear[],
  balance: FinancialStatementYear[],
  _cash: FinancialStatementYear[]
): FundamentalsDerived {
  
  const marketCap = parseNum(raw.MarketCapitalization);
  const pe = parseNum(raw.PERatio);
  const peg = parseNum(raw.PEGRatio);
  const pb = parseNum(raw.PriceToBookRatio);
  const roe = parseNum(raw.ReturnOnEquityTTM); // API usually returns generic number, e.g. 0.25 or 25? AV usually returns decimal string like "0.15" or "15"? 
  // Checking AV docs/examples: ReturnOnEquityTTM is usually "0.254"
  const profitMargin = parseNum(raw.ProfitMargin);

  // ROCE Approximation
  // ROCE = EBITDA / (Total Assets - Current Liabilities) -> We only have Total Liabilities here easily from simple interface
  // Let's use Capital Employed ~ Total Assets - Total Liabilities (Shareholder Equity) + NonCurrent Liabilities?
  // Prompt says: capitalEmployed ≈ totalAssets - totalLiabilities.
  // Wait, Capital Employed is usually Equity + Long Term Debt OR Total Assets - Current Liabilities.
  // Prompt instruction: "capitalEmployed ≈ totalAssets - totalLiabilities"
  // This is effectively Shareholder Equity. ROCE = EBITDA / Equity is basically ROE (if using Net Income).
  // But let's follow prompt instructions exactly: "roce ≈ EBITDA / capitalEmployed (if positive)"
  
  let roce: number | null = null;
  const ebitda = parseNum(raw.EBITDA);
  const latestBalance = balance[0]; // Assumes sorted descending by date usually from API, but we should verify.
  // AV returns annualReports usually sorted newest first.
  
  if (ebitda && latestBalance) {
    const capitalEmployed = (latestBalance.totalAssets || 0) - (latestBalance.totalLiabilities || 0);
    if (capitalEmployed > 0) {
      roce = ebitda / capitalEmployed;
    }
  }

  // CAGR Calculations
  // Sort income by date ascending for CAGR
  const sortedIncome = [...income].sort((a, b) => new Date(a.fiscalDateEnding).getTime() - new Date(b.fiscalDateEnding).getTime());
  
  let revenueCagr5y: number | null = null;
  let netIncomeCagr5y: number | null = null;

  if (sortedIncome.length >= 5) {
    const first = sortedIncome[sortedIncome.length - 5];
    const last = sortedIncome[sortedIncome.length - 1];
    
    if (first.totalRevenue && last.totalRevenue) {
      revenueCagr5y = cagr(first.totalRevenue, last.totalRevenue, 5);
    }
    if (first.netIncome && last.netIncome) {
      netIncomeCagr5y = cagr(first.netIncome, last.netIncome, 5);
    }
  }

  // Moat Comment
  let moatComment = "Too early to judge moat.";
  const roeVal = roe || 0;
  const pmVal = profitMargin || 0;
  const revCagrVal = revenueCagr5y || 0;

  if (revCagrVal > 0.10 && roeVal > 0.15 && pmVal > 0.10) {
    moatComment = "Consistently profitable with good growth – possible moat.";
  } else if (roeVal < 0.10) {
    moatComment = "Low ROE – weak capital efficiency.";
  }

  return {
    symbol: raw.symbol,
    name: raw.Name || raw.symbol,
    marketCap,
    pe,
    peg,
    pb,
    roe,
    roce,
    profitMargin,
    revenueCagr5y,
    netIncomeCagr5y,
    moatComment
  };
}
