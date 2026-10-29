export default function Header({ isDark, onToggleTheme }) {
  return (
    <header className="header">
      <div className="header-text">
        <h1>Market Anomaly Detection</h1>
        <p>Days when a stock's price move or trading volume was far outside its own normal range.</p>
      </div>
      <button type="button" className="button" onClick={onToggleTheme}>
        {isDark ? "Use light theme" : "Use dark theme"}
      </button>
    </header>
  );
}
