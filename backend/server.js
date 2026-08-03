const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Anomaly = require("./models/Anomaly");

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/anomaly_db";
const PORT = process.env.PORT || 5000;

// ---- Endpoint 1: get all anomalies ----
// GET /api/anomalies
app.get("/api/anomalies", async (req, res) => {
  try {
    const anomalies = await Anomaly.find().sort({ date: -1 });
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Endpoint 2: filter by ticker ----
// GET /api/anomalies/ticker/:ticker
app.get("/api/anomalies/ticker/:ticker", async (req, res) => {
  try {
    const anomalies = await Anomaly.find({ ticker: req.params.ticker }).sort({ date: -1 });
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Endpoint 3: filter by date range ----
// GET /api/anomalies/range?start=2025-08-01&end=2025-12-31
// ticker is optional here too - combine both filters if given.
app.get("/api/anomalies/range", async (req, res) => {
  try {
    const { start, end, ticker } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "start and end query params are required (YYYY-MM-DD)" });
    }

    const filter = {
      date: { $gte: new Date(start), $lte: new Date(end) },
    };
    if (ticker) filter.ticker = ticker;

    const anomalies = await Anomaly.find(filter).sort({ date: -1 });
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
