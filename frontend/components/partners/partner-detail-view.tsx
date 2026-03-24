"use client";

import Link from "next/link";
import { Building2, Clock3, Edit3 } from "lucide-react";
import { useMemo, useState } from "react";

import { useViewerAccess } from "@/components/contracts/use-viewer-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PartnerDetailResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PartnerDetailViewProps {
  detail: PartnerDetailResponse;
}

type ActiveTab = "contracts" | "history";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: value.includes("T") ? "2-digit" : undefined,
    minute: value.includes("T") ? "2-digit" : undefined
  }).format(new Date(value));
}

export function PartnerDetailView({ detail }: PartnerDetailViewProps) {
  const { role } = useViewerAccess();
  const [activeTab, setActiveTab] = useState<ActiveTab>("contracts");
  const canEdit = role === "manager";
  const item = detail.item;

  const infoRows = useMemo(
    () => [
      { label: "Tên đối tác", value: item.name },
      { label: "Loại", value: item.partner_type },
      { label: "MST", value: item.tax_code || "--" },
      { label: "Tên liên hệ", value: item.contact_name || "--" },
      { label: "Email liên hệ", value: item.contact_email || "--" },
      { label: "Số điện thoại", value: item.contact_phone || "--" },
      { label: "Owner chính", value: item.primary_owner },
      { label: "Owner dự phòng", value: item.backup_owner || "--" }
    ],
    [item]
  );

  return (
    <div className="space-y-6">
      <Card className="border-white/70 bg-white/92 shadow-panel">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl">{item.name}</CardTitle>
                <p className="mt-1 text-sm text-slate-500">{item.partner_type}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "border",
                  item.status === "active"
                    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-700"
                )}
              >
                {item.status_label}
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-slate-50">
                {item.active_contracts} HĐ active
              </Badge>
            </div>
          </div>

          {canEdit ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/partners/${item.id}/edit`}>
                <Edit3 className="mr-2 h-4 w-4" />
                Sửa
              </Link>
            </Button>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-5">
          {detail.message ? (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {detail.message}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {infoRows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  {row.label}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Ghi chú</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">{item.notes || "--"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-white/92 shadow-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex gap-2 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("contracts")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "contracts"
                  ? "bg-slate-950 text-slate-50"
                  : "text-slate-600"
              )}
            >
              Hợp đồng liên quan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "history"
                  ? "bg-slate-950 text-slate-50"
                  : "text-slate-600"
              )}
            >
              Lịch sử
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === "contracts" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số HĐ</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Giá trị</TableHead>
                  <TableHead>Ngày hết hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.contracts.length ? (
                  item.contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-semibold text-slate-900">
                        <Link href={`/contracts/${contract.id}`}>{contract.contract_number}</Link>
                      </TableCell>
                      <TableCell>{contract.owner}</TableCell>
                      <TableCell>{formatCurrency(contract.value_vnd)}</TableCell>
                      <TableCell>{formatDate(contract.expiry_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50">
                          {contract.status_label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                      Chưa có hợp đồng nào liên quan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-4">
              {item.history.length ? (
                item.history.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-slate-50">
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {log.description}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {log.actor} · {formatDate(log.changed_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm text-slate-500">
                  Chưa có log thay đổi.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
