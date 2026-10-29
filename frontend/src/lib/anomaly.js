import { formatLongMonth, formatMonth, formatPercent, shortTicker, toDateKey } from "./format.js";

const DAY = 86400000;
const PRICE_PATTERN = /price change z-score\s+(-?\d+(?:\.\d+)?)/i;
const VOLUME_PATTERN = /volume z-score\s+(-?\d+(?:\.\d+)?)/i;

export function normalizeAnomaly(raw) {
  const reason = raw.reason || "";
  const priceMatch = PRICE_PATTERN.exec(reason);
  const volumeMatch = VOLUME_PATTERN.exec(reason);
  const priceZ = priceMatch ? Number(priceMatch[1]) : null;
  const volumeZ = volumeMatch ? Number(volumeMatch[1]) : null;

  let kind = "other";
  if (priceZ !== null && volumeZ !== null) kind = "both";
  else if (priceZ !== null) kind = "price";
  else if (volumeZ !== null) kind = "volume";

  return {
    id: raw._id || `${raw.ticker}-${raw.date}`,
    time: Date.parse(raw.date),
    ticker: raw.ticker,
    change: typeof raw.price_change_pct === "number" ? raw.price_change_pct : null,
    volume: raw.volume,
    priceZ,
    volumeZ,
    kind,
  };
}

export function listTickers(items) {
  return [...new Set(items.map((item) => item.ticker))].sort();
}

export function tickersIn(items, order) {
  const present = new Set(items.map((item) => item.ticker));
  const known = order.filter((ticker) => present.has(ticker));
  const extra = [...present].filter((ticker) => !order.includes(ticker)).sort();
  return [...known, ...extra];
}

export function dateBounds(items) {
  if (items.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const item of items) {
    if (item.time < min) min = item.time;
    if (item.time > max) max = item.time;
  }
  return { min: toDateKey(min), max: toDateKey(max) };
}

export function makeColorResolver(tickers) {
  return (ticker) => {
    const index = tickers.indexOf(ticker);
    return index >= 0 && index < 8 ? `var(--series-${index + 1})` : "var(--text-muted)";
  };
}

export function summarize(items, tickers) {
  const counts = new Map();
  let rise = null;
  let fall = null;
  let heaviest = null;

  for (const item of items) {
    counts.set(item.ticker, (counts.get(item.ticker) || 0) + 1);
    if (item.change !== null && item.change > 0 && (!rise || item.change > rise.change)) rise = item;
    if (item.change !== null && item.change < 0 && (!fall || item.change < fall.change)) fall = item;
    if (!heaviest || item.volume > heaviest.volume) heaviest = item;
  }

  return {
    total: items.length,
    counts: tickers.map((ticker) => ({ ticker, count: counts.get(ticker) || 0 })),
    rise,
    fall,
    heaviest,
  };
}

export function monthlyCounts(items, tickers) {
  if (items.length === 0) return [];

  let first = Infinity;
  let last = -Infinity;
  for (const item of items) {
    if (item.time < first) first = item.time;
    if (item.time > last) last = item.time;
  }

  const startDate = new Date(first);
  const endDate = new Date(last);
  let year = startDate.getUTCFullYear();
  let month = startDate.getUTCMonth();
  const endIndex = endDate.getUTCFullYear() * 12 + endDate.getUTCMonth();

  const rows = new Map();
  while (year * 12 + month <= endIndex) {
    const time = Date.UTC(year, month, 1);
    const row = { key: year * 12 + month, label: formatMonth(time), fullLabel: formatLongMonth(time), total: 0 };
    for (const ticker of tickers) row[ticker] = 0;
    rows.set(row.key, row);
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  for (const item of items) {
    const date = new Date(item.time);
    const row = rows.get(date.getUTCFullYear() * 12 + date.getUTCMonth());
    if (!row) continue;
    row.total += 1;
    if (item.ticker in row) row[item.ticker] += 1;
  }

  return [...rows.values()];
}

export function monthTicks(min, max, maxCount) {
  const all = [];
  const start = new Date(min);
  let cursor = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
  while (cursor <= max) {
    all.push(cursor);
    const date = new Date(cursor);
    cursor = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
  }
  const step = Math.max(1, Math.ceil(all.length / maxCount));
  return all.filter((_, index) => index % step === 0);
}

export function buildTimeline(items, tickers) {
  const points = items.filter((item) => item.change !== null);
  if (points.length === 0) return null;

  let minTime = Infinity;
  let maxTime = -Infinity;
  let maxAbs = 0;
  let rise = null;
  let fall = null;

  for (const point of points) {
    if (point.time < minTime) minTime = point.time;
    if (point.time > maxTime) maxTime = point.time;
    if (Math.abs(point.change) > maxAbs) maxAbs = Math.abs(point.change);
    if (point.change > 0 && (!rise || point.change > rise.change)) rise = point;
    if (point.change < 0 && (!fall || point.change < fall.change)) fall = point;
  }

  const pad = Math.max((maxTime - minTime) * 0.03, 3 * DAY);
  const domain = [minTime - pad, maxTime + pad];
  const step = Math.max(1, Math.ceil((Math.ceil(maxAbs) + 1) / 3));
  const bound = step * 3;
  const yTicks = [-bound, -2 * step, -step, 0, step, 2 * step, bound];

  const callouts = new Map();
  if (rise) callouts.set(rise.id, { text: `${shortTicker(rise.ticker)} ${formatPercent(rise.change)}`, side: "above" });
  if (fall) callouts.set(fall.id, { text: `${shortTicker(fall.ticker)} ${formatPercent(fall.change)}`, side: "below" });

  const series = tickers
    .map((ticker) => ({
      ticker,
      points: points
        .filter((point) => point.ticker === ticker)
        .map((point) => ({ ...point, callout: callouts.get(point.id) || null })),
    }))
    .filter((entry) => entry.points.length > 0);

  return {
    domain,
    bound,
    yTicks,
    xTicks: monthTicks(domain[0], domain[1], 8),
    series,
  };
}
