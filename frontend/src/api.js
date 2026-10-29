const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const RANGE_FLOOR = "1970-01-01";
const RANGE_CEILING = "2100-12-31";

function buildPath({ ticker, start, end }) {
  if (start || end) {
    const params = new URLSearchParams({
      start: start || RANGE_FLOOR,
      end: end || RANGE_CEILING,
    });
    if (ticker) params.set("ticker", ticker);
    return `/api/anomalies/range?${params}`;
  }
  if (ticker) return `/api/anomalies/ticker/${encodeURIComponent(ticker)}`;
  return "/api/anomalies";
}

export async function fetchAnomalies(filters, signal) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${buildPath(filters)}`, { signal });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot reach the API. Check that the backend is running and the API URL is correct.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (body && body.error) throw new Error(body.error);
    if (response.status >= 500) {
      throw new Error(`The API returned status ${response.status}. Check that the backend and MongoDB are running.`);
    }
    throw new Error(`The request failed with status ${response.status}.`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("The API sent an unexpected response.");
  return data;
}
