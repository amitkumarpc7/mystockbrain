import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StockPage from './pages/StockPage';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stock/:symbol" element={<StockPage />} />
      </Routes>
    </div>
  );
}

export default App;
