export default function ChartCard({ title, subtitle, legend, busy, children }) {
  return (
    <section className={busy ? "panel is-busy" : "panel"} aria-busy={busy}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {legend}
      </div>
      {children}
    </section>
  );
}
