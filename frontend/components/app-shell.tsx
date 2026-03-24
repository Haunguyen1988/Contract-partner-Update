import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Contact,
  FileText,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Users
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Tong quan", icon: LayoutDashboard },
  { href: "/profiles", label: "Nguoi dung", icon: Contact },
  { href: "/partners", label: "Doi tac", icon: Users },
  { href: "/contracts", label: "Hop dong", icon: FileText },
  { href: "/payments", label: "Thanh toan", icon: Receipt },
  { href: "/budgets", label: "Ngan sach", icon: PiggyBank },
  { href: "/reports", label: "Bao cao", icon: BarChart3 }
] as const;

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
  title: string;
  description: string;
  headerAside?: ReactNode;
}

export function AppShell({
  children,
  currentPath,
  title,
  description,
  headerAside
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel backdrop-blur xl:flex">
          <div className="space-y-4">
            <Badge className="w-fit bg-primary/15 text-primary">PR COR Admin</Badge>
            <div>
              <h1 className="font-mono text-lg uppercase tracking-[0.28em] text-slate-500">
                Partner Contracts
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Bo khung quan tri hop dong doi tac bao chi noi bo cho nhom van hanh
                nho, uu tien toc do va trien khai gon.
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-slate-900 text-slate-50 shadow-lg shadow-slate-900/15"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[1.75rem] border border-dashed border-border/80 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Deployment target</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Frontend cho Vercel, backend cho Railway, du lieu dung Supabase san
              co.
            </p>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-3 shadow-panel backdrop-blur xl:hidden">
            <div className="mb-3 flex items-center justify-between px-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  PR COR Admin
                </p>
                <p className="text-sm font-semibold text-slate-950">
                  Partner contract workspace
                </p>
              </div>
              <Badge variant="outline">Mobile nav</Badge>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = currentPath === item.href;

                return (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                      active
                        ? "bg-slate-900 text-slate-50"
                        : "border border-border bg-background text-slate-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <header className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">
                  Internal Operations
                </Badge>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                    {title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>

              {headerAside || (
                <div className="rounded-2xl bg-slate-950 px-5 py-4 text-slate-50">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">
                    App stack
                  </p>
                  <p className="mt-2 text-sm">
                    Next.js 14 App Router + shadcn/ui + Tailwind CSS
                  </p>
                </div>
              )}
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
