interface MetricCardProps {
  label: string;
  value: string;
  caption?: string;
}

export function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
      }}
    >
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 13, fontWeight: 500 }}>{label}</p>
      <p style={{ margin: "12px 0 8px", fontSize: 32, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>{value}</p>
      {caption ? <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>{caption}</p> : null}
    </div>
  );
}

