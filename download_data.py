"""
STEP 2: Download 1 year of daily stock data for chosen tickers.

Run this on YOUR machine (not in a restricted sandbox), since it needs
to reach Yahoo Finance over the internet.

Usage:
    pip install yfinance pandas
    python download_data.py
"""

import yfinance as yf
import pandas as pd

# Pick your tickers here. .NS suffix = NSE (India). Change as needed.
TICKERS = ["RELIANCE.NS", "TCS.NS"]

all_data = []

for ticker in TICKERS:
    print(f"Downloading {ticker}...")
    df = yf.download(ticker, period="1y", interval="1d", auto_adjust=True)

    # yfinance returns columns as a MultiIndex like ('Close', 'RELIANCE.NS').
    # Flatten to plain column names ('Close', 'Volume', etc.) before doing
    # anything else, or later math on these columns will break.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = df.reset_index()
    df["Ticker"] = ticker
    all_data.append(df)

combined = pd.concat(all_data, ignore_index=True)

# Keep only the columns we need
combined = combined[["Date", "Ticker", "Close", "Volume"]]

# Safety net: force these to be actual numbers. If yfinance ever changes
# its output format again, this will fail loudly here instead of silently
# corrupting the CSV.
combined["Close"] = pd.to_numeric(combined["Close"], errors="raise")
combined["Volume"] = pd.to_numeric(combined["Volume"], errors="raise")

combined.to_csv("stock_data.csv", index=False)

print(f"Saved {len(combined)} rows to stock_data.csv")
print("Column types:")
print(combined.dtypes)