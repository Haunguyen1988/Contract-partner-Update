"use client";

import { apiRequest } from "../../../src/lib/api";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";
import { 
  Card, 
  DataTable, 
  Badge, 
  Button,
  LoadingState,
  EmptyState,
  PageHeader
} from "@contract/ui";
import { Clock, FileText, Landmark } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AlertsPage() {
  const { token } = useSession();
  const { data: alerts, loading: isLoading, error, reload: mutate } = useApiResource<any[]>("/api/internal/alerts", []);

  async function handleRefresh() {
    try {
      await apiRequest("/api/internal/alerts", { method: "POST" }, token);
      mutate();
      toast.success("Đã cập nhật cảnh báo mới nhất.");
    } catch (err) {
      toast.error("Không thể cập nhật cảnh báo.");
    }
  }

  async function handleResolve() {
    toast.info("Tính năng xử lý cảnh báo đang được phát triển.");
  }

  const columns = [
    {
      header: "Mức độ",
      accessor: (row: any) => (
        <Badge tone={row.severity === "CRITICAL" ? "critical" : row.severity === "WARNING" ? "warning" : "neutral"}>
          {row.severity}
        </Badge>
      )
    },
    {
      header: "Loại",
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          {row.type === "CONTRACT_EXPIRY" && <Clock className="h-4 w-4 text-warning" />}
          {row.type === "BUDGET_OVERAGE" && <Landmark className="h-4 w-4 text-critical" />}
          {row.type === "MISSING_DOCUMENT" && <FileText className="h-4 w-4 text-neutral" />}
          <span className="text-xs font-medium">{row.type}</span>
        </div>
      )
    },
    {
      header: "Tiêu đề",
      accessor: (row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.title}</span>
          <span className="text-xs text-gray-500">{row.message}</span>
        </div>
      )
    },
    {
      header: "Hạn xử lý",
      accessor: (row: any) => (
        <span className="text-xs text-gray-500">
          {format(new Date(row.dueDate), "dd/MM/yyyy")}
        </span>
      )
    },
    {
      header: "Thao tác",
      accessor: () => (
        <Button size="sm" variant="ghost" onClick={() => handleResolve()}>
          Đánh dấu đã đọc
        </Button>
      )
    }
  ];

  if (isLoading && !alerts) return <LoadingState />;
  if (error) return <EmptyState message="Không thể tải cảnh báo." />;

  return (
    <div className="p-6">
      <PageHeader 
        title="Cảnh báo hệ thống" 
        description="Theo dõi các vấn đề cần xử lý ngay lập tức."
      >
        <Button onClick={handleRefresh}>Làm mới cảnh báo</Button>
      </PageHeader>

      <Card>
        <DataTable data={alerts || []} columns={columns} />
      </Card>
    </div>
  );
}
