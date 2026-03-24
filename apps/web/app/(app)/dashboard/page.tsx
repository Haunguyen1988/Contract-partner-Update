"use client";

import { Badge, Card, DataTable, MetricCard, ProgressBar } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceGuard } from "../../../src/components/resource-guard";
import { formatCurrency, formatDate } from "../../../src/lib/format";
import { mockDashboard } from "../../../src/lib/mocks";
import { getResourcePageState } from "../../../src/lib/resource";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function DashboardPage() {
  const resource = useApiResource("/api/internal/dashboard/overview", mockDashboard);
  const { loading } = resource;
  const data = resource.data ?? mockDashboard;
  const pageState = getResourcePageState([resource]);

  return (
    <ResourceGuard label="dashboard điều hành" state={pageState}>
      <div className="stack">
        <section className="hero panel" style={{ background: "var(--bg-0)", border: "1px solid var(--line)", padding: 32, boxShadow: "none" }}>
          <PageHeader
            title="Tổng quan điều hành"
            description="Theo dõi hợp đồng active, cảnh báo mở, ngân sách cam kết và các việc ưu tiên xử lý trong ngày."
            actions={<Badge tone={loading ? "warning" : "success"}>{loading ? "Đang tải dữ liệu" : "Sẵn sàng"}</Badge>}
          />
          <div className="grid-4">
            <MetricCard label="Hợp đồng active" value={String(data.summary.activeContracts)} caption="Nguồn dữ liệu tập trung" />
            <MetricCard label="Sắp hết hạn" value={String(data.summary.expiringContracts)} caption="Cần xử lý trong chu kỳ hiện tại" />
            <MetricCard label="Cảnh báo mở" value={String(data.summary.openAlerts)} caption="In-app reminder cho team" />
            <MetricCard label="Ngân sách còn lại" value={data.summary.totalRemainingBudget} caption="Theo owner và fiscal year" />
          </div>
        </section>

      <div className="grid-2">
        <Card title="Phân bổ ngân sách theo Owner" eyebrow="Budget usage">
          <div className="stack" style={{ padding: "0 4px" }}>
            {data.topOwners.map((owner) => {
              const committed = Number(owner.committedAmount);
              const remaining = Number(owner.remainingAmount);
              const total = committed + remaining;
              const percentage = total > 0 ? (committed / total) * 100 : 0;
              
              let tone: "success" | "warning" | "danger" = "success";
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
        </Card>

        <Card title="Việc cần xử lý">
          <DataTable
            columns={["Tiêu đề", "Đến hạn", "Mức độ"]}
            rows={data.myTasks.map((task) => [
              task.title,
              formatDate(task.dueDate),
              <Badge key={task.id} tone={task.severity === "CRITICAL" ? "critical" : "warning"}>{task.severity}</Badge>
            ])}
          />
        </Card>
      </div>

      <Card title="Hợp đồng sắp hết hạn" eyebrow="Expiry watch">
        <DataTable
          columns={["Số hợp đồng", "Tiêu đề", "Đối tác", "Owner", "Ngày hết hạn", "Còn lại"]}
          rows={data.expiringContracts.map((contract) => [
            contract.contractNo,
            contract.title,
            contract.partnerName,
            contract.ownerName,
            formatDate(contract.endDate),
            `${contract.daysRemaining} ngày`
          ])}
        />
      </Card>
      </div>
    </ResourceGuard>
  );
}
