"use client";

import { 
  Badge, 
  Card, 
  DataTable, 
  MetricCard, 
  ProgressBar,
  LoadingState,
  PageHeader as PageHeaderUI,
  Column 
} from "@contract/ui";
import { formatCurrency, formatDate } from "../../../src/lib/format";
import { mockDashboard } from "../../../src/lib/mocks";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function DashboardPage() {
  const resource = useApiResource("/api/internal/dashboard/overview", mockDashboard);
  const { loading, source } = resource;
  const data = resource.data ?? mockDashboard;

  if (source === "loading") {
    return <LoadingState />;
  }

  const taskColumns: Column<any>[] = [
    { header: "Tiêu đề", accessor: (t) => t.title },
    { header: "Đến hạn", accessor: (t) => formatDate(t.dueDate) },
    { header: "Mức độ", accessor: (t) => <Badge tone={t.severity === "CRITICAL" ? "critical" : "warning"}>{t.severity}</Badge> }
  ];

  const expiryColumns: Column<any>[] = [
    { header: "Số hợp đồng", accessor: (c) => c.contractNo },
    { header: "Tiêu đề", accessor: (c) => c.title },
    { header: "Đối tác", accessor: (c) => c.partnerName },
    { header: "Owner", accessor: (c) => c.ownerName },
    { header: "Ngày hết hạn", accessor: (c) => formatDate(c.endDate) },
    { header: "Còn lại", accessor: (c) => `${c.daysRemaining} ngày` }
  ];

  return (
    <div className="stack" style={{ padding: 24 }}>
      <PageHeaderUI
        title="Tổng quan điều hành"
        description="Theo dõi hợp đồng active, cảnh báo mở, ngân sách cam kết và các việc ưu tiên xử lý trong ngày."
      >
        <Badge tone={loading ? "warning" : "success"}>{loading ? "Đang tải dữ liệu" : "Sẵn sàng"}</Badge>
      </PageHeaderUI>

      <div className="grid-4">
        <MetricCard label="Hợp đồng active" value={String(data.summary.activeContracts)} caption="Nguồn dữ liệu tập trung" />
        <MetricCard label="Sắp hết hạn" value={String(data.summary.expiringContracts)} caption="Cần xử lý trong chu kỳ hiện tại" />
        <MetricCard label="Cảnh báo mở" value={String(data.summary.openAlerts)} caption="In-app reminder cho team" />
        <MetricCard label="Ngân sách còn lại" value={data.summary.totalRemainingBudget} caption="Theo owner và fiscal year" />
      </div>

      <div className="grid-2">
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Phân bổ ngân sách theo Owner</h3>
            <div className="stack" style={{ gap: 16 }}>
              {data.topOwners.map((owner: any) => {
                const committed = Number(owner.committedAmount);
                const remaining = Number(owner.remainingAmount);
                const total = committed + remaining;
                
                let tone: "success" | "warning" | "danger" = "success";
                const percentage = total > 0 ? (committed / total) * 100 : 0;
                if (percentage > 90) tone = "danger";
                else if (percentage > 70) tone = "warning";

                return (
                  <ProgressBar
                    key={owner.ownerName}
                    label={owner.ownerName}
                    sublabel={`${formatCurrency(committed)} / ${formatCurrency(total)}`}
                    value={committed}
                    max={total}
                    tone={tone}
                  />
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Việc cần xử lý</h3>
            <DataTable data={data.myTasks || []} columns={taskColumns} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Hợp đồng sắp hết hạn</h3>
          <DataTable data={data.expiringContracts || []} columns={expiryColumns} />
        </div>
      </Card>
    </div>
  );
}
