import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { stocksUS } from '../data/stocksUS';
import { stocksIN } from '../data/stocksIN';
import type { Market } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const [market, setMarket] = useState<Market>('US');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<'none' | 'asc' | 'desc'>('none');

  const currentStocks = market === 'US' ? stocksUS : stocksIN;
  const currencySymbol = market === 'US' ? '$' : '₹';

  const filteredStocks = useMemo(() => {
    let result = currentStocks.filter(s => {
      const matchSearch = s.symbol.toLowerCase().includes(search.toLowerCase()) || 
                          s.name.toLowerCase().includes(search.toLowerCase());
      const price = s.lastPrice;
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      
      return matchSearch && price >= min && price <= max;
    });

    if (sort === 'asc') {
      result.sort((a, b) => a.lastPrice - b.lastPrice);
    } else if (sort === 'desc') {
      result.sort((a, b) => b.lastPrice - a.lastPrice);
    }

    return result;
  }, [currentStocks, search, minPrice, maxPrice, sort]);

  const handleAnalyze = (symbol: string) => {
    navigate(`/stock/${symbol}?market=${market}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-400 mb-2">Stock Brain</h1>
        <p className="text-slate-400">Select a Stock for Educational Analysis</p>
      </header>

      {/* Market Toggle */}
      <div className="flex justify-center mb-8 gap-4">
        <label className={`cursor-pointer px-6 py-2 rounded-full border transition-colors ${market === 'US' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
          <input 
            type="radio" 
            name="market" 
            value="US" 
            checked={market === 'US'} 
            onChange={() => setMarket('US')} 
            className="hidden" 
          />
          US Stocks
        </label>
        <label className={`cursor-pointer px-6 py-2 rounded-full border transition-colors ${market === 'IN' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
          <input 
            type="radio" 
            name="market" 
            value="IN" 
            checked={market === 'IN'} 
            onChange={() => setMarket('IN')} 
            className="hidden" 
          />
          India Stocks
        </label>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <input 
          type="text" 
          placeholder="Search Symbol or Name..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
        />
        <input 
          type="number" 
          placeholder="Min Price" 
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
        />
        <input 
          type="number" 
          placeholder="Max Price" 
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
        />
        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value as any)}
          className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="none">Sort by Price</option>
          <option value="asc">Low → High</option>
          <option value="desc">High → Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="p-4 font-medium">Symbol</th>
              <th className="p-4 font-medium">Company</th>
              <th className="p-4 font-medium text-right">Price</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => (
                <tr key={stock.symbol} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold text-blue-300">{stock.symbol}</td>
                  <td className="p-4 text-slate-300">{stock.name}</td>
                  <td className="p-4 text-right font-mono text-slate-200">
                    {currencySymbol}{stock.lastPrice.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleAnalyze(stock.symbol)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No stocks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
