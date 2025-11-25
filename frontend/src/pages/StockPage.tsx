import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import type { Market, FundamentalsDerived, TAResult, BacktestResult } from '../types';
import { fetchDailyCandles } from '../services/marketData';
import { fetchFundamentalsOverview, fetchIncomeStatement, fetchBalanceSheet, fetchCashFlow } from '../services/fundamentals';
import { deriveFundamentals } from '../fa/metrics';
import { analyzeTA } from '../ta/indicators';
import { backtestSmaCrossover } from '../quant/backtest';

export default function StockPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const market = (searchParams.get('market') as Market) || 'US';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [faData, setFaData] = useState<FundamentalsDerived | null>(null);
  const [taData, setTaData] = useState<TAResult | null>(null);
  const [quantData, setQuantData] = useState<BacktestResult | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Parallel fetching
        const [candles, overview, income, balance, cash] = await Promise.all([
          fetchDailyCandles(symbol, market),
          fetchFundamentalsOverview(symbol),
          fetchIncomeStatement(symbol),
          fetchBalanceSheet(symbol),
          fetchCashFlow(symbol)
        ]);

        // Process FA
        const derivedFa = deriveFundamentals(overview, income, balance, cash);
        setFaData(derivedFa);

        // Process TA
        const ta = analyzeTA(symbol, candles);
        setTaData(ta);

        // Process Quant
        const quant = backtestSmaCrossover(symbol, candles);
        setQuantData(quant);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load stock data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol, market]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-blue-400 animate-pulse">Analyzing {symbol}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-red-400 text-lg mb-4">Error: {error}</div>
        <button onClick={() => navigate('/')} className="text-blue-400 hover:underline">
          ← Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <button onClick={() => navigate('/')} className="mb-6 text-slate-400 hover:text-white transition-colors">
        ← Back to list
      </button>

      <header className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-bold text-white mb-2">{symbol}</h1>
        <h2 className="text-xl text-slate-400">{faData?.name}</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        
        {/* Fundamental Card */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 border-b border-slate-800 pb-2">Fundamental Snapshot</h3>
          <div className="space-y-3 text-sm">
            <Row label="Market Cap" value={faData?.marketCap ? `$${(faData.marketCap / 1e9).toFixed(2)}B` : '-'} />
            <Row label="P/E Ratio" value={faData?.pe?.toFixed(2)} />
            <Row label="PEG Ratio" value={faData?.peg?.toFixed(2)} />
            <Row label="P/B Ratio" value={faData?.pb?.toFixed(2)} />
            <Row label="ROE" value={fmtPct(faData?.roe)} />
            <Row label="ROCE (Approx)" value={fmtPct(faData?.roce)} />
            <Row label="Profit Margin" value={fmtPct(faData?.profitMargin)} />
            <Row label="Rev CAGR (5y)" value={fmtPct(faData?.revenueCagr5y)} />
            <Row label="Net Inc CAGR (5y)" value={fmtPct(faData?.netIncomeCagr5y)} />
            
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-slate-400 block mb-1">Moat Analysis:</span>
              <p className="text-slate-200 italic">{faData?.moatComment}</p>
            </div>
          </div>
        </div>

        {/* Technical Card */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg">
          <h3 className="text-xl font-bold text-blue-400 mb-4 border-b border-slate-800 pb-2">Technical Snapshot</h3>
          <div className="space-y-3 text-sm">
            <Row label="Last Close" value={taData?.lastClose.toFixed(2)} />
            <Row label="SMA 20" value={taData?.sma20?.toFixed(2)} />
            <Row label="SMA 50" value={taData?.sma50?.toFixed(2)} />
            <Row label="SMA 200" value={taData?.sma200?.toFixed(2)} />
            <Row label="RSI (14)" value={taData?.rsi14?.toFixed(2)} />
            
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Trend</span>
              <span className={`font-bold ${taData?.trend === 'Uptrend' ? 'text-green-400' : taData?.trend === 'Downtrend' ? 'text-red-400' : 'text-yellow-400'}`}>
                {taData?.trend}
              </span>
            </div>
            
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Signal</span>
              <span className={`font-bold ${taData?.signal === 'Bullish' ? 'text-green-400' : taData?.signal === 'Bearish' ? 'text-red-400' : 'text-slate-200'}`}>
                {taData?.signal}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-slate-400 block mb-1">Analysis:</span>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                {taData?.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Quant Card */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-lg">
          <h3 className="text-xl font-bold text-purple-400 mb-4 border-b border-slate-800 pb-2">Quant Backtest (SMA 50/200)</h3>
          <div className="space-y-3 text-sm">
            <Row label="Total Return" value={`${quantData?.totalReturn.toFixed(2)}%`} highlight={quantData?.totalReturn !== undefined ? quantData.totalReturn > 0 : undefined} />
            <Row label="CAGR" value={`${quantData?.cagr.toFixed(2)}%`} />
            <Row label="Max Drawdown" value={`${quantData?.maxDrawdown.toFixed(2)}%`} />
            <Row label="Win Rate" value={`${quantData?.winRate.toFixed(2)}%`} />
            <Row label="Trades" value={quantData?.numTrades} />
            <Row label="Sharpe (Approx)" value={quantData?.sharpeApprox?.toFixed(2)} />
            
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-slate-400 block mb-1">Verdict:</span>
              <p className="text-slate-200 italic">{quantData?.comment}</p>
            </div>
          </div>
        </div>

      </div>

      <footer className="text-center text-slate-600 text-sm mt-12 border-t border-slate-900 pt-6">
        <p>This is an educational tool. Not investment advice.</p>
        <p className="mt-1">Data provided by Alpha Vantage. API limits may apply.</p>
      </footer>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string, value: string | number | undefined | null, highlight?: boolean | null }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-800/50 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className={`font-mono ${highlight === true ? 'text-green-400' : highlight === false ? 'text-red-400' : 'text-slate-200'}`}>
        {value ?? '-'}
      </span>
    </div>
  );
}

function fmtPct(val: number | undefined | null) {
  if (val === undefined || val === null) return '-';
  return `${(val * 100).toFixed(2)}%`;
}
