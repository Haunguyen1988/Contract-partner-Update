interface MetricCardProps {
  label: string;
  value: string;
  caption?: string;
}

export function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 20,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid rgba(15, 23, 42, 0.08)"
      }}
    >
      <p style={{ margin: 0, color: "#64748b", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ margin: "14px 0 8px", fontSize: 34, fontWeight: 800, color: "#0f172a" }}>{value}</p>
      {caption ? <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>{caption}</p> : null}
    </div>
  );
}

