"""
STEP 4: Detect anomalies in stock price/volume data.

Reads stock_data.csv (produced by download_data.py), calculates:
  - Daily % price change per ticker
  - Z-score of price change and volume per ticker
Flags any day where |z-score| > Z_THRESHOLD as anomalous.

Why z-score?
  It measures how many "standard deviations" a value is from the
  average for THAT ticker. This matters because different stocks
  have different normal volatility - a 3% move might be huge for
  a stable stock but normal for a volatile one. Z-score adjusts
  for that automatically, per ticker.

Usage:
    python detect_anomalies.py
"""

import pandas as pd
import json

Z_THRESHOLD = 2.0  # anything beyond 2 std devs from the mean is flagged

df = pd.read_csv("stock_data.csv", parse_dates=["Date"])
df = df.sort_values(["Ticker", "Date"])

anomalies = []

for ticker, group in df.groupby("Ticker"):
    group = group.copy()

    # % change in closing price vs previous day
    group["pct_change"] = group["Close"].pct_change() * 100

    # z-score for price change and volume, computed within this ticker only
    group["price_z"] = (group["pct_change"] - group["pct_change"].mean()) / group["pct_change"].std()
    group["volume_z"] = (group["Volume"] - group["Volume"].mean()) / group["Volume"].std()

    for _, row in group.iterrows():
        reasons = []
        if pd.notna(row["price_z"]) and abs(row["price_z"]) > Z_THRESHOLD:
            reasons.append(f"price change z-score {row['price_z']:.2f}")
        if pd.notna(row["volume_z"]) and abs(row["volume_z"]) > Z_THRESHOLD:
            reasons.append(f"volume z-score {row['volume_z']:.2f}")

        if reasons:
            anomalies.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
                "ticker": ticker,
                "price_change_pct": round(row["pct_change"], 2) if pd.notna(row["pct_change"]) else None,
                "volume": int(row["Volume"]),
                "reason": "; ".join(reasons)
            })

with open("anomalies.json", "w") as f:
    json.dump(anomalies, f, indent=2)

print(f"Found {len(anomalies)} anomalies. Saved to anomalies.json")