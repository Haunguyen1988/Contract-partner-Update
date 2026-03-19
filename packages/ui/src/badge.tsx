import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "critical";
}

const toneMap: Record<NonNullable<BadgeProps["tone"]>, { bg: string; fg: string; border: string }> = {
  neutral: { bg: "var(--bg-2)", fg: "var(--muted)", border: "var(--line)" },
  success: { bg: "#ecfdf5", fg: "#059669", border: "#a7f3d0" },
  warning: { bg: "#fffbeb", fg: "#d97706", border: "#fde68a" },
  critical: { bg: "#fef2f2", fg: "#dc2626", border: "#fecaca" }
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  const colors = toneMap[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`
      }}
    >
      {children}
    </span>
  );
}

