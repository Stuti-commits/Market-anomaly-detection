import { formatPercent } from "../lib/format.js";

export default function Delta({ value }) {
  if (value === null || value === undefined) {
    return <span className="delta delta-flat">{"—"}</span>;
  }

  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";

  return (
    <span className={`delta delta-${direction}`}>
      {direction !== "flat" && (
        <svg className="delta-icon" viewBox="0 0 8 8" aria-hidden="true">
          <polygon points={direction === "up" ? "4,0.5 7.5,7 0.5,7" : "0.5,1 7.5,1 4,7.5"} />
        </svg>
      )}
      {formatPercent(value)}
    </span>
  );
}
