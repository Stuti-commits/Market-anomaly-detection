import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "./ChartCard.jsx";
import Legend from "./Legend.jsx";
import { monthlyCounts } from "../lib/anomaly.js";
import { shortTicker } from "../lib/format.js";

const CORNER = 4;
const GAP = 2;

function topRoundedPath(x, y, width, height, radius) {
  return `M${x},${y + height}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + width - radius}Q${x + width},${y} ${x + width},${y + radius}V${y + height}Z`;
}

function Segment({ x, y, width, height, row, ticker, order, color }) {
  if (!row || !row[ticker] || !(height > 0)) return null;

  const hasSegmentAbove = order.slice(order.indexOf(ticker) + 1).some((other) => row[other] > 0);
  const trim = hasSegmentAbove ? Math.min(GAP, height - 1) : 0;
  const top = y + trim;
  const drawn = height - trim;
  const radius = hasSegmentAbove ? 0 : Math.min(CORNER, width / 2, drawn);

  return <path d={topRoundedPath(x, top, width, drawn, radius)} style={{ fill: color }} />;
}

function MonthlyTooltip({ active, payload, tickers, colorOf }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  if (!row) return null;

  return (
    <div className="tooltip">
      <div className="tooltip-value">{row.total}</div>
      <div className="tooltip-title">flagged in {row.fullLabel}</div>
      <dl className="tooltip-rows">
        {tickers.map((ticker) => (
          <div key={ticker}>
            <dt>
              <span className="line-key" style={{ background: colorOf(ticker) }} />
              {shortTicker(ticker)}
            </dt>
            <dd>{row[ticker]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function MonthlyChart({ items, tickers, colorOf, busy }) {
  const rows = useMemo(() => monthlyCounts(items, tickers), [items, tickers]);

  return (
    <ChartCard
      title="Flagged days by month"
      subtitle="How many days were flagged in each month."
      legend={<Legend tickers={tickers} colorOf={colorOf} shape="square" />}
      busy={busy}
    >
      <div
        className="chart"
        role="img"
        aria-label="Bar chart of flagged days per month. The table below lists the same days."
      >
        <ResponsiveContainer width="100%" height={340}>
          <BarChart key={tickers.join("|")} data={rows} margin={{ top: 24, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              cursor={{ className: "bar-cursor" }}
              isAnimationActive={false}
              content={<MonthlyTooltip tickers={tickers} colorOf={colorOf} />}
            />
            {tickers.map((ticker) => (
              <Bar
                key={ticker}
                dataKey={ticker}
                stackId="months"
                maxBarSize={24}
                isAnimationActive={false}
                shape={(props) => (
                  <Segment
                    x={props.x}
                    y={props.y}
                    width={props.width}
                    height={props.height}
                    row={props.payload}
                    ticker={ticker}
                    order={tickers}
                    color={colorOf(ticker)}
                  />
                )}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
