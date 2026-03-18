import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "critical";
}

const toneMap: Record<NonNullable<BadgeProps["tone"]>, { bg: string; fg: string }> = {
  neutral: { bg: "#e2e8f0", fg: "#0f172a" },
  success: { bg: "#dcfce7", fg: "#166534" },
  warning: { bg: "#fef3c7", fg: "#92400e" },
  critical: { bg: "#fee2e2", fg: "#991b1b" }
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
        color: colors.fg
      }}
    >
      {children}
    </span>
  );
}

