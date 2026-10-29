import { useMemo, useState } from "react";
import AnomalyTable from "./components/AnomalyTable.jsx";
import Filters from "./components/Filters.jsx";
import Header from "./components/Header.jsx";
import MonthlyChart from "./components/MonthlyChart.jsx";
import StateMessage from "./components/StateMessage.jsx";
import Summary from "./components/Summary.jsx";
import TimelineChart from "./components/TimelineChart.jsx";
import { useAnomalies } from "./hooks/useAnomalies.js";
import { useTheme } from "./hooks/useTheme.js";
import { dateBounds, listTickers, makeColorResolver, summarize, tickersIn } from "./lib/anomaly.js";

const INITIAL_FILTERS = { ticker: "", start: "", end: "", kind: "all" };

export default function App() {
  const { isDark, toggle } = useTheme();
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const isPristine =
    !filters.ticker && !filters.start && !filters.end && filters.kind === "all";
  const isUnfiltered = !filters.ticker && !filters.start && !filters.end;

  const catalog = useAnomalies({ ticker: "", start: "", end: "" });
  const scoped = useAnomalies(
    { ticker: filters.ticker, start: filters.start, end: filters.end },
    { skip: isUnfiltered }
  );
  const source = isUnfiltered ? catalog : scoped;

  const allTickers = useMemo(() => listTickers(catalog.items), [catalog.items]);
  const bounds = useMemo(() => dateBounds(catalog.items), [catalog.items]);
  const colorOf = useMemo(() => makeColorResolver(allTickers), [allTickers]);

  const items = useMemo(
    () => source.items.filter((item) => filters.kind === "all" || item.kind === filters.kind),
    [source.items, filters.kind]
  );
  const shownTickers = useMemo(() => tickersIn(items, allTickers), [items, allTickers]);
  const summary = useMemo(() => summarize(items, shownTickers), [items, shownTickers]);

  const updateFilters = (changes) => setFilters((current) => ({ ...current, ...changes }));
  const resetFilters = () => setFilters(INITIAL_FILTERS);

  const isLoading = source.status === "loading";
  const hasData = source.items.length > 0;
  const busy = isLoading && hasData;

  let body;
  if (source.status === "error") {
    body = (
      <StateMessage title="Could not load anomalies" actionLabel="Try again" onAction={source.retry}>
        {source.message}
      </StateMessage>
    );
  } else if (isLoading && !hasData) {
    body = <StateMessage title="Loading anomalies">Fetching the flagged days from the API.</StateMessage>;
  } else if (items.length === 0) {
    body = (
      <StateMessage
        title="No flagged days match these filters"
        actionLabel={isPristine ? undefined : "Clear filters"}
        onAction={resetFilters}
      >
        {isPristine
          ? "The API returned no anomalies. Run the seed script in the backend folder to load them."
          : "Try a wider date range, another stock, or a different flag type."}
      </StateMessage>
    );
  } else {
    body = (
      <>
        <Summary summary={summary} colorOf={colorOf} />
        <div className="charts">
          <TimelineChart items={items} tickers={shownTickers} colorOf={colorOf} busy={busy} />
          <MonthlyChart items={items} tickers={shownTickers} colorOf={colorOf} busy={busy} />
        </div>
        <AnomalyTable items={items} colorOf={colorOf} busy={busy} />
      </>
    );
  }

  return (
    <div className="page">
      <Header isDark={isDark} onToggleTheme={toggle} />
      <main className="content">
        <Filters
          filters={filters}
          tickers={allTickers}
          bounds={bounds}
          isPristine={isPristine}
          onChange={updateFilters}
          onReset={resetFilters}
        />
        {body}
      </main>
      <footer className="footer">
        <p>
          A z-score shows how unusual a day is for that stock. Zero is normal, and the further from zero, the stranger
          the day. The detection script flags a day when a z-score goes beyond its threshold, which is 2 by default.
        </p>
      </footer>
    </div>
  );
}
