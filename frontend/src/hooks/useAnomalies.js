import { useCallback, useEffect, useState } from "react";
import { fetchAnomalies } from "../api.js";
import { normalizeAnomaly } from "../lib/anomaly.js";

export function useAnomalies({ ticker, start, end }, { skip = false } = {}) {
  const [state, setState] = useState({ items: [], status: "loading", message: "" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (skip) return undefined;

    const controller = new AbortController();
    setState((current) => ({ ...current, status: "loading", message: "" }));

    fetchAnomalies({ ticker, start, end }, controller.signal)
      .then((rows) => {
        setState({ items: rows.map(normalizeAnomaly), status: "ready", message: "" });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState((current) => ({ ...current, status: "error", message: error.message }));
      });

    return () => controller.abort();
  }, [ticker, start, end, skip, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { ...state, retry };
}
