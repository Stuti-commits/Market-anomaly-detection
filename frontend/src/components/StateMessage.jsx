export default function StateMessage({ title, children, actionLabel, onAction }) {
  return (
    <section className="panel state" role="status">
      <h2>{title}</h2>
      <p>{children}</p>
      {actionLabel && (
        <button type="button" className="button button-solid" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}
