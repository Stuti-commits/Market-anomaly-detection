const mongoose = require("mongoose");

// One document = one flagged anomaly day for one ticker.
const anomalySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  ticker: { type: String, required: true },
  price_change_pct: { type: Number, default: null },
  volume: { type: Number, required: true },
  reason: { type: String, required: true },
});

// Index on ticker and date since those are the two things we filter by.
// Without this, MongoDB scans every document on every filtered query -
// fine at 500 rows, a real problem at 5 million.
anomalySchema.index({ ticker: 1, date: 1 });

module.exports = mongoose.model("Anomaly", anomalySchema);
