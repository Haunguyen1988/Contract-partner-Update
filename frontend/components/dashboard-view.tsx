import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  PiggyBank,
  ShieldCheck
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  getDashboardAlerts,
  getDashboardOwnerMatrix,
  getDashboardStats
} from "@/lib/api";
import { DashboardAlertUrgency, DashboardAlertItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/partners", label: "Đối tác", icon: Building2 },
  { href: "/contracts", label: "Hợp đồng", icon: FileText },
  { href: "/budgets", label: "Ngân sách", icon: PiggyBank },
  { href: "/reports", label: "Báo cáo", icon: BarChart3 }
] as const;

function formatDate(value?: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function urgencyStyles(urgency: DashboardAlertUrgency) {
  switch (urgency) {
    case "red":
      return {
        row: "bg-red-50/80 hover:!bg-red-50",
        badge: "border-red-200 bg-red-100 text-red-700"
      };
    case "yellow":
      return {
        row: "bg-amber-50/80 hover:!bg-amber-50",
        badge: "border-amber-200 bg-amber-100 text-amber-700"
      };
    case "orange":
      return {
        row: "bg-orange-50/80 hover:!bg-orange-50",
        badge: "border-orange-200 bg-orange-100 text-orange-700"
      };
    default:
      return {
        row: "",
        badge: "border-slate-200 bg-slate-100 text-slate-700"
      };
  }
}

function statusText(item: DashboardAlertItem) {
  if (item.days_remaining === null || item.days_remaining === undefined) {
    return item.status;
  }

  if (item.days_remaining < 0) {
    return `Quá hạn ${Math.abs(item.days_remaining)} ngày`;
  }

  return `${item.status} · ${item.days_remaining} ngày`;
}

function StatCard({
  title,
  value,
  description,
  accent
}: {
  title: string;
  value: string;
  description: string;
  accent: "green" | "red" | "yellow" | "purple";
}) {
  const accentClass = {
    green:
      "border-emerald-200/70 bg-[linear-gradient(180deg,_rgba(236,253,245,0.98),_rgba(209,250,229,0.82))]",
    red:
      "border-rose-200/70 bg-[linear-gradient(180deg,_rgba(255,241,242,0.98),_rgba(255,228,230,0.82))]",
    yellow:
      "border-amber-200/70 bg-[linear-gradient(180deg,_rgba(255,251,235,0.98),_rgba(254,243,199,0.82))]",
    purple:
      "border-violet-200/70 bg-[linear-gradient(180deg,_rgba(245,243,255,0.98),_rgba(237,233,254,0.82))]"
  }[accent];

  return (
    <Card className={cn("shadow-panel", accentClass)}>
      <CardHeader className="pb-3">
        <CardDescription className="text-sm font-medium text-slate-700">
          {title}
        </CardDescription>
        <CardTitle className="text-4xl text-slate-950">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}

export async function DashboardView() {
  const [statsResponse, alertsResponse, ownerMatrixResponse] = await Promise.all([
    getDashboardStats(),
    getDashboardAlerts(),
    getDashboardOwnerMatrix()
  ]);

  const sharedMessage =
    statsResponse.message || alertsResponse.message || ownerMatrixResponse.message;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(147,51,234,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-80 shrink-0 flex-col rounded-[2rem] border border-slate-200/70 bg-slate-950 p-6 text-slate-50 shadow-panel xl:flex">
          <div className="space-y-5">
            <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-teal-100">
              HĐ Báo chí PR COR
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Bảng điều khiển hợp đồng
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Theo dõi nhanh tình trạng hợp đồng, ngân sách và đầu việc cần xử lý
                của đội vận hành đối tác báo chí.
              </p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/dashboard";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <p className="text-sm font-semibold">Trạng thái dữ liệu</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {statsResponse.connected
                ? "Đang đọc dữ liệu tổng quan trực tiếp từ FastAPI backend."
                : sharedMessage || "Đang dùng dữ liệu mẫu để hoàn thiện giao diện."}
            </p>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-4 shadow-panel backdrop-blur xl:hidden">
            <div className="mb-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
                HĐ Báo chí PR COR
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Dashboard tổng quan
              </h2>
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/dashboard";

                return (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                      active
                        ? "bg-slate-950 text-slate-50"
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

          <section className="rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-panel backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <Badge className="w-fit border-transparent bg-teal-100 text-teal-700">
                  Tổng quan vận hành
                </Badge>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                    Dashboard điều hành hợp đồng báo chí
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    Tập trung vào những hợp đồng cần can thiệp sớm, tiến độ duyệt
                    và mức sử dụng ngân sách theo từng owner và đối tác.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 text-xs",
                    statsResponse.connected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  )}
                >
                  {statsResponse.connected ? "Live backend" : "Demo fallback"}
                </Badge>
                <p className="text-sm text-slate-500">
                  Cập nhật:{" "}
                  {new Intl.DateTimeFormat("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit"
                  }).format(new Date(statsResponse.fetched_at))}
                </p>
              </div>
            </div>

            {sharedMessage ? (
              <div className="mt-5 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {sharedMessage}
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 xl:grid-cols-4">
            <StatCard
              title="Tổng HĐ đang Active"
              value={String(statsResponse.stats.active_contracts)}
              description="Các hợp đồng đang vận hành bình thường và còn hiệu lực."
              accent="green"
            />
            <StatCard
              title="HĐ sắp hết hạn trong 30 ngày"
              value={String(statsResponse.stats.expiring_in_30_days)}
              description="Ưu tiên rà soát gia hạn và chốt ngân sách ngay trong tháng."
              accent={statsResponse.stats.expiring_in_30_days > 0 ? "red" : "green"}
            />
            <StatCard
              title="HĐ đang chờ duyệt"
              value={String(statsResponse.stats.pending_approval)}
              description="Các hồ sơ vẫn đang nằm ở bước review hoặc chờ phê duyệt."
              accent="yellow"
            />
            <StatCard
              title="Budget đã dùng %"
              value={formatPercent(statsResponse.stats.budget_used_percent)}
              description="Tỷ lệ sử dụng ngân sách tổng hợp từ backend dashboard."
              accent="purple"
            />
          </section>

          <section>
            <Card className="border-white/70 bg-white/90 shadow-panel">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">⚠️ Cần xử lý</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    Danh sách hợp đồng đang gần hạn và cần follow-up ngay với đối tác
                    hoặc owner phụ trách.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="w-fit border-slate-200 bg-slate-50">
                  {alertsResponse.items.length} mục
                </Badge>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Số HĐ</TableHead>
                      <TableHead>Đối tác</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Hết hạn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertsResponse.items.length ? (
                      alertsResponse.items.map((item) => {
                        const tone = urgencyStyles(item.urgency);

                        return (
                          <TableRow key={`${item.contract_number}-${item.partner}`} className={tone.row}>
                            <TableCell className="font-semibold text-slate-900">
                              {item.contract_number}
                            </TableCell>
                            <TableCell>{item.partner}</TableCell>
                            <TableCell>{item.owner}</TableCell>
                            <TableCell>{formatDate(item.expiry_date)}</TableCell>
                            <TableCell>
                              <Badge className={cn("border", tone.badge)}>
                                {statusText(item)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell className="py-10 text-center text-sm text-slate-500" colSpan={5}>
                          Không có hợp đồng nào cần xử lý ngay.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-white/70 bg-white/90 shadow-panel">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Phân công theo nhân sự</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    Ma trận owner và đối tác để nhìn nhanh tải công việc, hợp đồng
                    active và mức dùng budget theo từng cặp phụ trách.
                  </CardDescription>
                </div>
                <Badge className="w-fit border-transparent bg-slate-100 text-slate-700">
                  Owner × Đối tác
                </Badge>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Đối tác</TableHead>
                      <TableHead>Số HĐ Active</TableHead>
                      <TableHead>Hết hạn gần nhất</TableHead>
                      <TableHead>Budget %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownerMatrixResponse.items.length ? (
                      ownerMatrixResponse.items.map((item) => (
                        <TableRow key={`${item.owner}-${item.partner}`}>
                          <TableCell className="font-medium text-slate-900">
                            {item.owner}
                          </TableCell>
                          <TableCell>{item.partner}</TableCell>
                          <TableCell>{item.active_contracts}</TableCell>
                          <TableCell>{formatDate(item.nearest_expiry)}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "border",
                                item.budget_used_percent >= 80
                                  ? "border-rose-200 bg-rose-100 text-rose-700"
                                  : item.budget_used_percent >= 60
                                    ? "border-amber-200 bg-amber-100 text-amber-700"
                                    : "border-emerald-200 bg-emerald-100 text-emerald-700"
                              )}
                            >
                              {formatPercent(item.budget_used_percent)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="py-10 text-center text-sm text-slate-500" colSpan={5}>
                          Chưa có dữ liệu phân công theo nhân sự.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-white/70 bg-white/90 shadow-panel">
              <CardContent className="flex items-start gap-4 p-6">
                <AlertTriangle className="mt-1 h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Gợi ý vận hành
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Ưu tiên rà soát các hợp đồng đỏ trước, sau đó chuyển qua những
                    hợp đồng vàng trong vòng 15 ngày để tránh dồn việc vào cuối kỳ.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-slate-950 text-slate-50 shadow-panel">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Snapshot
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {alertsResponse.items.length} việc cần follow-up
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Kết hợp danh sách cảnh báo và ma trận owner để ưu tiên đúng người,
                  đúng đối tác và đúng thời điểm.
                </p>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
