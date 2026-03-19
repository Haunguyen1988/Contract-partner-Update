import type { PropsWithChildren, ReactNode } from "react";

interface CardProps extends PropsWithChildren {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function Card({ title, eyebrow, actions, children }: CardProps) {
  return (
    <section
      style={{
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow)"
      }}
    >
      {(title || eyebrow || actions) && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <div>
            {eyebrow ? (
              <p style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, color: "#64748b" }}>{eyebrow}</p>
            ) : null}
            {title ? <h3 style={{ margin: "6px 0 0", fontSize: 22, color: "#0f172a" }}>{title}</h3> : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

