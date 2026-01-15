export default function Loading() {
  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
        <span>Cargando…</span>
      </div>
    </main>
  );
}
