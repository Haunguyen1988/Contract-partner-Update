"use client";

import { Building2, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";

import { useViewerAccess } from "@/components/contracts/use-viewer-access";
import { Badge } from "@/components/ui/badge";
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
import { getPartners } from "@/lib/api";
import { PartnerStatus, PartnersListResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMPTY_RESPONSE: PartnersListResponse = {
  connected: false,
  fetched_at: new Date().toISOString(),
  message: null,
  total: 0,
  items: []
};

function statusBadgeClass(status: PartnerStatus) {
  return status === "active"
    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-700";
}

export function PartnersPageView() {
  const router = useRouter();
  const { loading: viewerLoading, role } = useViewerAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PartnerStatus | "">("");
  const deferredSearch = useDeferredValue(search);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PartnersListResponse>(EMPTY_RESPONSE);

  useEffect(() => {
    if (viewerLoading) {
      return;
    }

    let active = true;

    async function loadPartners() {
      setLoading(true);
      setError(null);

      try {
        const data = await getPartners({
          search: deferredSearch || undefined,
          status
        });

        if (!active) {
          return;
        }

        setResponse(data);
      } catch {
        if (active) {
          setError("Không thể tải danh sách đối tác. Vui lòng thử lại.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPartners();

    return () => {
      active = false;
    };
  }, [viewerLoading, deferredSearch, status]);

  return (
    <div className="space-y-6">
      <Card className="border-white/70 bg-white/92 shadow-panel">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Danh bạ đối tác báo chí
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tìm kiếm theo tên hoặc MST, theo dõi owner chính và số hợp đồng active
                của từng đối tác.
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
                {role === "manager" ? "Admin / Manager" : "Staff"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tìm kiếm</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên đối tác hoặc MST"
                  className="pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Trạng thái</label>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as PartnerStatus | "")}
              >
                <option value="">Tất cả</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Đối tác ({response.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên đối tác</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>MST</TableHead>
                <TableHead>Owner chính</TableHead>
                <TableHead>Số HĐ Active</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải danh sách đối tác...
                    </div>
                  </TableCell>
                </TableRow>
              ) : response.items.length ? (
                response.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/partners/${item.id}`)}
                  >
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.partner_type}</TableCell>
                    <TableCell>{item.tax_code || "--"}</TableCell>
                    <TableCell>{item.primary_owner}</TableCell>
                    <TableCell>{item.active_contracts}</TableCell>
                    <TableCell>
                      <Badge className={cn("border", statusBadgeClass(item.status))}>
                        {item.status_label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                    Không tìm thấy đối tác phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
