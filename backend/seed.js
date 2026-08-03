/**
 * STEP 1: Load anomalies.json into MongoDB.
 *
 * Run this once (and again any time you regenerate anomalies.json):
 *   node seed.js
 */

const fs = require("fs");
const mongoose = require("mongoose");
const Anomaly = require("./models/Anomaly");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/anomaly_db";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const raw = fs.readFileSync("./anomalies.json", "utf-8");
  const data = JSON.parse(raw);

  // Wipe existing data so re-running this doesn't create duplicates.
  await Anomaly.deleteMany({});

  const docs = data.map((a) => ({
    date: new Date(a.date),
    ticker: a.ticker,
    price_change_pct: a.price_change_pct,
    volume: a.volume,
    reason: a.reason,
  }));

  await Anomaly.insertMany(docs);
  console.log(`Inserted ${docs.length} anomalies`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
