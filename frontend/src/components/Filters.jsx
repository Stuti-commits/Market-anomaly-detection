import Segmented from "./Segmented.jsx";
import { shiftMonths, shortTicker } from "../lib/format.js";

const KIND_OPTIONS = [
  { value: "all", label: "All" },
  { value: "price", label: "Price" },
  { value: "volume", label: "Volume" },
  { value: "both", label: "Both" },
];

const PERIOD_OPTIONS = [
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "all", label: "All time" },
];

function detectPeriod(filters, bounds) {
  if (!filters.start && !filters.end) return "all";
  if (!bounds || filters.end !== bounds.max) return "custom";
  if (filters.start === shiftMonths(bounds.max, 3)) return "3m";
  if (filters.start === shiftMonths(bounds.max, 6)) return "6m";
  return "custom";
}

export default function Filters({ filters, tickers, bounds, isPristine, onChange, onReset }) {
  const period = detectPeriod(filters, bounds);

  const applyPeriod = (value) => {
    if (value === "all") {
      onChange({ start: "", end: "" });
      return;
    }
    if (!bounds) return;
    onChange({ start: shiftMonths(bounds.max, value === "3m" ? 3 : 6), end: bounds.max });
  };

  const changeStart = (value) => {
    if (value && filters.end && value > filters.end) onChange({ start: value, end: value });
    else onChange({ start: value });
  };

  const changeEnd = (value) => {
    if (value && filters.start && value < filters.start) onChange({ start: value, end: value });
    else onChange({ end: value });
  };

  return (
    <form className="filters" onSubmit={(event) => event.preventDefault()} aria-label="Filters">
      <label className="field">
        <span className="field-label">Stock</span>
        <select
          className="control"
          value={filters.ticker}
          onChange={(event) => onChange({ ticker: event.target.value })}
        >
          <option value="">All stocks</option>
          {tickers.map((ticker) => (
            <option key={ticker} value={ticker}>
              {shortTicker(ticker)}
            </option>
          ))}
        </select>
      </label>

      <Segmented
        label="Period"
        options={PERIOD_OPTIONS}
        value={period}
        disabled={!bounds}
        onChange={applyPeriod}
      />

      <label className="field">
        <span className="field-label">From</span>
        <input
          className="control"
          type="date"
          value={filters.start}
          min={bounds ? bounds.min : undefined}
          max={bounds ? bounds.max : undefined}
          onChange={(event) => changeStart(event.target.value)}
        />
      </label>

      <label className="field">
        <span className="field-label">To</span>
        <input
          className="control"
          type="date"
          value={filters.end}
          min={bounds ? bounds.min : undefined}
          max={bounds ? bounds.max : undefined}
          onChange={(event) => changeEnd(event.target.value)}
        />
      </label>

      <Segmented
        label="Flagged for"
        options={KIND_OPTIONS}
        value={filters.kind}
        onChange={(value) => onChange({ kind: value })}
      />

      <button type="button" className="button button-quiet" onClick={onReset} disabled={isPristine}>
        Clear filters
      </button>
    </form>
  );
}
