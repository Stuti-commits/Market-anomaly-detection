import Delta from "./Delta.jsx";
import { formatDate, formatVolumeCompact, shortTicker } from "../lib/format.js";

function Fact({ label, value, item, colorOf }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      {item ? (
        <>
          <dd className="fact-value">{value}</dd>
          <dd className="fact-meta">
            <span className="swatch swatch-dot" style={{ background: colorOf(item.ticker) }} />
            {shortTicker(item.ticker)} on {formatDate(item.time)}
          </dd>
        </>
      ) : (
        <dd className="fact-value fact-empty">None</dd>
      )}
    </div>
  );
}

export default function Summary({ summary, colorOf }) {
  const visibleCounts = summary.counts.filter((entry) => entry.count > 0);

  return (
    <section className="summary" aria-label="Summary">
      <div className="hero">
        <p className="hero-value">{summary.total}</p>
        <p className="hero-label">{summary.total === 1 ? "flagged day" : "flagged days"}</p>
        <ul className="hero-split">
          {visibleCounts.map((entry) => (
            <li key={entry.ticker}>
              <span className="swatch swatch-dot" style={{ background: colorOf(entry.ticker) }} />
              {shortTicker(entry.ticker)} {entry.count}
            </li>
          ))}
        </ul>
      </div>

      <dl className="facts">
        <Fact
          label="Biggest rise"
          item={summary.rise}
          value={summary.rise && <Delta value={summary.rise.change} />}
          colorOf={colorOf}
        />
        <Fact
          label="Biggest fall"
          item={summary.fall}
          value={summary.fall && <Delta value={summary.fall.change} />}
          colorOf={colorOf}
        />
        <Fact
          label="Heaviest volume"
          item={summary.heaviest}
          value={summary.heaviest && `${formatVolumeCompact(summary.heaviest.volume)} shares`}
          colorOf={colorOf}
        />
      </dl>
    </section>
  );
}
