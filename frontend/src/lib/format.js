const MINUS = "−";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const longMonthFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const wholeNumberFormatter = new Intl.NumberFormat("en-IN");

function signed(value, digits) {
  const sign = value > 0 ? "+" : value < 0 ? MINUS : "";
  return `${sign}${Math.abs(value).toFixed(digits)}`;
}

export function formatDate(ms) {
  return dateFormatter.format(ms);
}

export function formatMonth(ms) {
  const date = new Date(ms);
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${year}`;
}

export function formatLongMonth(ms) {
  return longMonthFormatter.format(ms);
}

export function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${signed(value, 2)}%`;
}

export function formatAxisPercent(value) {
  const sign = value > 0 ? "+" : value < 0 ? MINUS : "";
  return `${sign}${Math.abs(value)}%`;
}

export function formatZ(value) {
  if (value === null || value === undefined) return "—";
  return signed(value, 2);
}

export function formatVolume(value) {
  return wholeNumberFormatter.format(value);
}

export function formatVolumeCompact(value) {
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  return wholeNumberFormatter.format(value);
}

export function shortTicker(ticker) {
  return ticker.replace(/\.[A-Za-z]{1,3}$/, "");
}

export function toDateKey(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function shiftMonths(dateKey, months) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.toISOString().slice(0, 10);
}
