require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

// Allow your frontend origin in production
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "*", // set to your domain in prod
  })
);

app.use(express.json());

// Yahoo Finance endpoints
const YAHOO_CHART_BASE_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
// Alpha Vantage for fundamentals
// const ALPHA_BASE_URL = "https://www.alphavantage.co/query";
// const ALPHA_KEY = process.env.ALPHA_VANTAGE_API_KEY;

console.log("YAHOO_CHART_BASE_URL", YAHOO_CHART_BASE_URL);
console.log("FINNHUB_API_KEY", FINNHUB_API_KEY);

// ✅ Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ✅ Candles endpoint: /api/candles/AAPL
app.get("/api/candles/:symbol", async (req, res) => {
  const symbol = req.params.symbol;

  try {
    const url = `${YAHOO_CHART_BASE_URL}/${encodeURIComponent(symbol)}`;
    const params = {
      range: "5y",
      interval: "1d",
    };

    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (err) {
    console.error("Error in /api/candles:", err?.response?.data || err);
    res.status(500).json({
      error: "Failed to fetch candles data",
      details: err?.message,
    });
  }
});

// ✅ Fundamentals endpoint: /api/fundamentals/AAPL
app.get("/api/fundamentals/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  if (!FINNHUB_API_KEY) {
    return res.status(500).json({
      error: "FINNHUB_API_KEY not configured",
    });
  }

  try {
    const url = "https://finnhub.io/api/v1/stock/metric";
    const params = {
      symbol,
      metric: "all",
      token: FINNHUB_API_KEY,
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    if (!data || !data.metric) {
      throw new Error("No fundamentals found for this symbol.");
    }

    res.json(data);
  } catch (err) {
    console.error("Error in /api/fundamentals:", err?.response?.data || err);
    res.status(500).json({
      error: "Failed to fetch fundamentals data",
      details: err?.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Stock Brain API running on port ${PORT}`);
});
