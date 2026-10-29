# Market Anomaly Detection System

Finds days when a stock's price move or trading volume was far outside its own normal range, stores them in MongoDB, and shows them in a dashboard.

Current data: **RELIANCE.NS** and **TCS.NS** (NSE), 1 year of daily prices. The pipeline flags **40 days** (22 Reliance, 18 TCS).

## How it works

```
Yahoo Finance
     |  download_data.py
     v
stock_data.csv  --detect_anomalies.py-->  anomalies.json
                                               |  npm run seed
                                               v
                                          MongoDB (anomaly_db)
                                               |
                                      Express API  :5000
                                               |
                                      React dashboard  :5173
```

- **Data pipeline (Python):** downloads prices, calculates z-scores, writes flagged days to `anomalies.json`.
- **Backend (Node, Express, Mongoose):** loads `anomalies.json` into MongoDB and serves it through 3 read-only endpoints.
- **Frontend (React, Vite, Recharts):** filters, summary, two charts and a sortable table.

### What a z-score means

- It shows how far a day is from that stock's own average, measured in standard deviations.
- Each stock is judged against itself, so a 3% move can be flagged for a calm stock and ignored for a jumpy one.
- Two z-scores are checked per day: daily % price change and trading volume.
- A day is flagged when either one goes beyond `Z_THRESHOLD` (2.0 in `detect_anomalies.py`).

## Folder structure

```
market-anomaly-detection-system/
├── download_data.py
├── detect_anomalies.py
├── stock_data.csv
├── anomalies.json
├── backend/
│   ├── server.js
│   ├── seed.js
│   ├── anomalies.json
│   ├── package.json
│   └── models/
│       └── Anomaly.js
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── styles.css
        ├── hooks/        useAnomalies.js, useTheme.js
        ├── lib/          anomaly.js, format.js
        └── components/   Filters, Summary, TimelineChart, MonthlyChart, AnomalyTable, ...
```

`server.js` and `seed.js` load `./models/Anomaly`. Make sure `Anomaly.js` sits inside a `models` folder.

## API

| Endpoint                                                                 | Purpose                                 |
| ------------------------------------------------------------------------ | --------------------------------------- |
| `GET /api/anomalies`                                                     | All flagged days, newest first          |
| `GET /api/anomalies/ticker/:ticker`                                      | One stock, for example `/ticker/TCS.NS` |
| `GET /api/anomalies/range?start=YYYY-MM-DD&end=YYYY-MM-DD&ticker=TCS.NS` | Date range, `ticker` is optional        |

- The range endpoint returns `400` if `start` or `end` is missing.
- Errors return `{ "error": "message" }`.

Example item:

```json
{
  "_id": "6650f0c2a1b2c3d4e5f60718",
  "date": "2026-01-06T00:00:00.000Z",
  "ticker": "RELIANCE.NS",
  "price_change_pct": -4.47,
  "volume": 27417125,
  "reason": "price change z-score -3.51; volume z-score 2.05"
}
```

## Frontend

- **Filters:** stock, period presets, custom dates, and flag type (price, volume or both). Filters call the matching API endpoint:
  - no filter: `/api/anomalies`
  - stock only: `/api/anomalies/ticker/:ticker`
  - any date: `/api/anomalies/range`
- **Summary:** number of flagged days, biggest rise, biggest fall and heaviest volume.
- **Price change chart:** one dot per flagged day, with the biggest rise and fall labelled.
- **Monthly chart:** flagged days per month, stacked by stock.
- **Table:** sortable columns, 10 rows per page. The z-score columns sort by distance from zero.
- **Other:** dark and light theme, phone layout, error state with retry, empty state with clear filters.
- Each stock keeps the same colour across all filters.
- Period presets count back from the **latest flagged day**, not today's date.

## Known limits

- **The frontend reads z-scores from the `reason` text.** If you change the wording in `detect_anomalies.py`, the z-score columns go blank. A cleaner fix is to save `price_z` and `volume_z` as their own fields.
- **Big moves can be bad data, not news.** TCS jumps +6.51% on 2 Jun 2026, then falls 8.39% the next day. These are the two biggest moves in the dataset. Check them against NSE records before treating them as real events. The pipeline cannot tell a data error from a real event.
- **Each day is judged with the full year's average, including future days.** Fine for reviewing history. Not valid for live alerts, which would need a rolling window.
- **Zero-volume rows exist.** Each stock has 4 days with `Volume = 0` (for example 15 Jan 2026), where the price is just copied from the day before. They do not change today's 40 flags, but they pull the averages and could change results on other stocks or dates. Drop rows where `Volume == 0` in `download_data.py`.
- **Data is a snapshot.** `stock_data.csv` ends on 3 Aug 2026. Re-run the pipeline and the seed script to refresh it.
- **Colours are checked for up to 3 stocks at once on the scatter chart.** Beyond that, colours are harder to tell apart. Use the stock filter.
- **The API has no login and no paging.** Fine for hundreds of rows, not for millions.
