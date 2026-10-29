import { useMemo } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard.jsx";
import Delta from "./Delta.jsx";
import Legend from "./Legend.jsx";
import { buildTimeline } from "../lib/anomaly.js";
import { formatAxisPercent, formatDate, formatMonth, formatVolume, formatZ, shortTicker } from "../lib/format.js";

function Marker({ cx, cy, payload, color, anchorFor }) {
  if (typeof cx !== "number" || typeof cy !== "number" || !payload) return null;
  const callout = payload.callout;

  return (
    <g>
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      <circle cx={cx} cy={cy} r={6} className="dot" style={{ fill: color }} />
      {callout && (
        <text
          x={cx}
          y={callout.side === "above" ? cy - 14 : cy + 22}
          textAnchor={anchorFor(payload.time)}
          className="callout"
        >
          {callout.text}
        </text>
      )}
    </g>
  );
}

function TimelineTooltip({ active, payload, colorOf }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  if (!point) return null;

  return (
    <div className="tooltip">
      <div className="tooltip-value">
        <Delta value={point.change} />
      </div>
      <div className="tooltip-title">
        <span className="line-key" style={{ background: colorOf(point.ticker) }} />
        {shortTicker(point.ticker)} on {formatDate(point.time)}
      </div>
      <dl className="tooltip-rows">
        <div>
          <dt>Volume</dt>
          <dd>{formatVolume(point.volume)}</dd>
        </div>
        <div>
          <dt>Price z-score</dt>
          <dd>{formatZ(point.priceZ)}</dd>
        </div>
        <div>
          <dt>Volume z-score</dt>
          <dd>{formatZ(point.volumeZ)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function TimelineChart({ items, tickers, colorOf, busy }) {
  const model = useMemo(() => buildTimeline(items, tickers), [items, tickers]);

  const anchorFor = useMemo(() => {
    if (!model) return () => "middle";
    const [min, max] = model.domain;
    return (time) => {
      const ratio = (time - min) / (max - min);
      if (ratio < 0.12) return "start";
      if (ratio > 0.88) return "end";
      return "middle";
    };
  }, [model]);

  return (
    <ChartCard
      title="Price change on flagged days"
      subtitle="Each dot is one flagged day. Dots above the line are rises, dots below are falls."
      legend={<Legend tickers={tickers} colorOf={colorOf} shape="dot" />}
      busy={busy}
    >
      {model ? (
        <div
          className="chart"
          role="img"
          aria-label="Scatter chart of the daily price change on each flagged day. The table below lists the same days."
        >
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 24, right: 20, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                type="number"
                dataKey="time"
                domain={model.domain}
                ticks={model.xTicks}
                tickFormatter={formatMonth}
                tickLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={16}
                allowDataOverflow
              />
              <YAxis
                type="number"
                dataKey="change"
                domain={[-model.bound, model.bound]}
                ticks={model.yTicks}
                tickFormatter={formatAxisPercent}
                tickLine={false}
                axisLine={false}
                width={52}
                allowDataOverflow
              />
              <ReferenceLine y={0} className="zero-line" />
              <Tooltip
                cursor={false}
                isAnimationActive={false}
                content={<TimelineTooltip colorOf={colorOf} />}
              />
              {model.series.map((entry) => (
                <Scatter
                  key={entry.ticker}
                  name={shortTicker(entry.ticker)}
                  data={entry.points}
                  isAnimationActive={false}
                  shape={(props) => <Marker {...props} color={colorOf(entry.ticker)} anchorFor={anchorFor} />}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="chart-empty">No price changes to plot.</p>
      )}
    </ChartCard>
  );
}
