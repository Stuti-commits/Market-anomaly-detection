import { useEffect, useMemo, useState } from "react";
import Delta from "./Delta.jsx";
import { formatDate, formatVolume, formatZ, shortTicker } from "../lib/format.js";

const PAGE_SIZE = 10;

const COLUMNS = [
  { key: "time", label: "Date", numeric: false },
  { key: "ticker", label: "Stock", numeric: false },
  { key: "change", label: "Price change", numeric: true },
  { key: "volume", label: "Volume", numeric: true },
  { key: "priceZ", label: "Price z-score", numeric: true, absolute: true },
  { key: "volumeZ", label: "Volume z-score", numeric: true, absolute: true },
];

function sortValue(item, column) {
  const value = item[column.key];
  if (value === null || value === undefined) return null;
  return column.absolute ? Math.abs(value) : value;
}

function sortItems(items, column, direction) {
  const factor = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = sortValue(a, column);
    const right = sortValue(b, column);
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    if (typeof left === "string") return left.localeCompare(right) * factor;
    return (left - right) * factor;
  });
}

function SortIcon({ state }) {
  return (
    <svg className="sort-icon" viewBox="0 0 8 12" aria-hidden="true">
      <polygon points="4,0.5 7.5,4.5 0.5,4.5" className={state === "asc" ? "is-active" : ""} />
      <polygon points="4,11.5 7.5,7.5 0.5,7.5" className={state === "desc" ? "is-active" : ""} />
    </svg>
  );
}

export default function AnomalyTable({ items, colorOf, busy }) {
  const [sort, setSort] = useState({ key: "time", direction: "desc" });
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [items, sort]);

  const column = COLUMNS.find((entry) => entry.key === sort.key);
  const sorted = useMemo(() => sortItems(items, column, sort.direction), [items, column, sort.direction]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const first = sorted.length === 0 ? 0 : current * PAGE_SIZE + 1;
  const last = Math.min(sorted.length, (current + 1) * PAGE_SIZE);

  const toggleSort = (key) => {
    setSort((existing) =>
      existing.key === key
        ? { key, direction: existing.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "ticker" ? "asc" : "desc" }
    );
  };

  return (
    <section className={busy ? "panel panel-table is-busy" : "panel panel-table"} aria-busy={busy}>
      <div className="panel-head table-head">
        <div>
          <h2>Flagged days</h2>
          <p>A dash means that measure was normal on the day. Sorting by a z-score ranks the strangest days first.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <caption className="sr-only">Flagged days with price change, volume and z-scores</caption>
          <thead>
            <tr>
              {COLUMNS.map((entry) => {
                const active = sort.key === entry.key;
                return (
                  <th
                    key={entry.key}
                    scope="col"
                    className={entry.numeric ? "numeric" : undefined}
                    aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <button type="button" className="sort" onClick={() => toggleSort(entry.key)}>
                      {entry.label}
                      <SortIcon state={active ? sort.direction : "none"} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.time)}</td>
                <td>
                  <span className="stock">
                    <span className="swatch swatch-dot" style={{ background: colorOf(item.ticker) }} />
                    {shortTicker(item.ticker)}
                  </span>
                </td>
                <td className="numeric">
                  <Delta value={item.change} />
                </td>
                <td className="numeric">{formatVolume(item.volume)}</td>
                <td className={item.priceZ === null ? "numeric is-muted" : "numeric"}>{formatZ(item.priceZ)}</td>
                <td className={item.volumeZ === null ? "numeric is-muted" : "numeric"}>{formatZ(item.volumeZ)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <p>
          Showing {first} to {last} of {sorted.length}
        </p>
        <div className="pager-buttons">
          <button type="button" className="button" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Previous
          </button>
          <button
            type="button"
            className="button"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
