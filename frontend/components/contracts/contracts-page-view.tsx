"use client";

import { Download, FileSearch, Filter, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { useViewerAccess } from "@/components/contracts/use-viewer-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getContracts } from "@/lib/api";
import {
  ContractListItem,
  ContractStatus,
  ContractsListResponse
} from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<{ label: string; value: ContractStatus | "" }> = [
  { label: "Tất cả", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Hết hạn", value: "expired" }
];

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
    year: "numeric"
  }).format(new Date(value));
}

function statusBadgeClass(status: ContractStatus) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "expired":
      return "border-rose-200 bg-rose-100 text-rose-700";
    case "pending":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "draft":
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const EMPTY_RESPONSE: ContractsListResponse = {
  connected: false,
  fetched_at: new Date().toISOString(),
  message: null,
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  total_pages: 1,
  owners: [],
  items: []
};

export function ContractsPageView() {
  const router = useRouter();
  const { loading: viewerLoading, role, ownerId, displayName, isDemo } = useViewerAccess();
  const [searchInput, setSearchInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ContractStatus | "">("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ContractsListResponse>(EMPTY_RESPONSE);

  const deferredSearch = useDeferredValue(searchInput);
  const effectiveOwnerId = role === "staff" ? ownerId || "" : selectedOwnerId;

  useEffect(() => {
    setPage(1);
  }, [searchInput, selectedStatus, selectedOwnerId]);

  useEffect(() => {
    if (viewerLoading) {
      return;
    }

    let active = true;

    async function loadContracts() {
      setLoading(true);
      setError(null);

      try {
        const data = await getContracts({
          status: selectedStatus,
          owner_id: effectiveOwnerId || undefined,
          search: deferredSearch || undefined,
          page,
          limit: PAGE_SIZE
        });

        if (!active) {
          return;
        }

        setResponse(data);

        if (page > data.total_pages) {
          setPage(data.total_pages);
        }
      } catch {
        if (!active) {
          return;
        }

        setError("Không thể tải danh sách hợp đồng. Vui lòng thử lại.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadContracts();

    return () => {
      active = false;
    };
  }, [viewerLoading, selectedStatus, effectiveOwnerId, deferredSearch, page]);

  const ownerOptions = useMemo(() => response.owners, [response.owners]);

  async function handleExportCsv() {
    setExporting(true);

    try {
      const data = await getContracts({
        status: selectedStatus,
        owner_id: effectiveOwnerId || undefined,
        search: deferredSearch || undefined,
        page: 1,
        limit: 1000
      });

      const rows = [
        ["So HD", "Doi tac", "Owner", "Gia tri (VND)", "Ngay het han", "Trang thai"],
        ...data.items.map((item) => [
          item.contract_number,
          item.partner,
          item.owner,
          item.value_vnd,
          item.expiry_date || "",
          item.status_label
        ])
      ];

      const csvContent = rows
        .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "contracts-export.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/70 bg-white/92 shadow-panel">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Danh sách hợp đồng
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tìm nhanh theo số HĐ hoặc đối tác, lọc theo trạng thái, owner và
                theo dõi hạn hết hiệu lực.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1",
                  response.connected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                )}
              >
                {response.connected ? "Live data" : "Demo data"}
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-slate-50">
                {role === "manager" ? "Manager view" : "Staff view"}
              </Badge>
              {role === "staff" ? (
                <Badge className="border-transparent bg-primary/10 text-primary">
                  Owner: {displayName}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr_0.8fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Tìm kiếm
              </label>
              <div className="relative">
                <FileSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Tìm theo số HĐ, tên đối tác"
                  className="pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Trạng thái
              </label>
              <Select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as ContractStatus | "")
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Owner
              </label>
              {role === "manager" ? (
                <Select
                  value={selectedOwnerId}
                  onChange={(event) => setSelectedOwnerId(event.target.value)}
                >
                  <option value="">Tất cả owner</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                  Staff chỉ xem HĐ của mình
                </div>
              )}
            </div>
          </div>

          {response.message ? (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {response.message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-white/92 shadow-panel">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">
              Hợp đồng ({response.total})
            </CardTitle>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            10 dòng / trang
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số HĐ</TableHead>
                <TableHead>Đối tác</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Giá trị (VNĐ)</TableHead>
                <TableHead>Ngày hết hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải dữ liệu hợp đồng...
                    </div>
                  </TableCell>
                </TableRow>
              ) : response.items.length ? (
                response.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/contracts/${item.id}`)}
                  >
                    <TableCell className="font-semibold text-slate-900">
                      {item.contract_number}
                    </TableCell>
                    <TableCell>{item.partner}</TableCell>
                    <TableCell>{item.owner}</TableCell>
                    <TableCell>{formatCurrency(item.value_vnd)}</TableCell>
                    <TableCell
                      className={cn(
                        item.expires_in_days !== null &&
                          item.expires_in_days !== undefined &&
                          item.expires_in_days <= 30
                          ? "font-semibold text-rose-600"
                          : "text-slate-700"
                      )}
                    >
                      {formatDate(item.expiry_date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn("border", statusBadgeClass(item.status))}
                      >
                        {item.status_label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                    Không tìm thấy hợp đồng phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
              >
                Trang trước
              </Button>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                Trang {response.page} / {response.total_pages}
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setPage((current) => Math.min(response.total_pages, current + 1))
                }
                disabled={page >= response.total_pages || loading}
              >
                Trang sau
              </Button>
            </div>

            <Button
              onClick={handleExportCsv}
              disabled={exporting || loading}
              className="self-end rounded-full"
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {isDemo ? (
        <p className="text-sm text-slate-500">
          Chưa có session Supabase thực, nên giao diện đang ở chế độ demo Manager
          để bạn xem đầy đủ chức năng lọc và tạo mới.
        </p>
      ) : null}
    </div>
  );
}
