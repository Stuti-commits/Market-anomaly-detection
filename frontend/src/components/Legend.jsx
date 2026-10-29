import { shortTicker } from "../lib/format.js";

export default function Legend({ tickers, colorOf, shape }) {
  if (tickers.length < 2) return null;

  return (
    <ul className="legend" aria-label="Stocks">
      {tickers.map((ticker) => (
        <li key={ticker}>
          <span className={`swatch swatch-${shape}`} style={{ background: colorOf(ticker) }} />
          {shortTicker(ticker)}
        </li>
      ))}
    </ul>
  );
}
