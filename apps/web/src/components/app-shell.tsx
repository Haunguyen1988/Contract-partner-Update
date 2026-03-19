"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@contract/ui";
import { useSession } from "../lib/session";

const navigation = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/partners", label: "Đối tác" },
  { href: "/contracts", label: "Hợp đồng" },
  { href: "/budgets", label: "Ngân sách" },
  { href: "/users", label: "Người dùng" },
  { href: "/alerts", label: "Cảnh báo" },
  { href: "/settings", label: "Cấu hình" },
  { href: "/imports", label: "Import CSV" },
  { href: "/audit", label: "Audit log" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();

  return (
    <div className="app-grid">
      <aside className="sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="brand-mark"></span>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.05em" }}>PR COR Internal</p>
            <h2 style={{ margin: "2px 0 0", fontSize: 18, color: "var(--text)" }}>Contract MVP</h2>
          </div>
        </div>

        <div className="nav-stack">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link" data-active={pathname === item.href}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="panel" style={{ marginTop: 24, padding: 18, background: "var(--bg-1)", boxShadow: "none" }}>
          <p className="muted" style={{ marginTop: 0, fontSize: 13, fontWeight: 500 }}>Phiên bản MVP Phase 1</p>
          <p style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>{user?.fullName ?? "Guest"}</p>
          <Badge tone="neutral">{user?.role ?? "UNAUTHENTICATED"}</Badge>
          <div style={{ marginTop: 16 }}>
            <button
              className="button-ghost"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <main className="content-area">
        <div className="topbar">
          <div>
            <p className="muted" style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Hệ thống quản trị hợp đồng báo chí</p>
            <h1 style={{ margin: "4px 0 0", fontSize: 28, letterSpacing: "-0.02em" }}>Vận hành tập trung, kiểm soát minh bạch</h1>
          </div>
          <Badge tone="success">In-app alerts only</Badge>
        </div>
        {children}
      </main>
    </div>
  );
}

