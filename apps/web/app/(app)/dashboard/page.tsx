"use client";

import { Badge, Card, DataTable, MetricCard } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceState } from "../../../src/components/resource-state";
import { formatCurrency, formatDate } from "../../../src/lib/format";
import { mockDashboard } from "../../../src/lib/mocks";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function DashboardPage() {
  const resource = useApiResource("/api/internal/dashboard/overview", mockDashboard);
  const { error, loading, source, usingFallback } = resource;
  const data = resource.data ?? mockDashboard;

  if (source === "loading") {
    return <ResourceState source={source} label="dashboard điều hành" />;
  }

  if (source === "unavailable" && !resource.data) {
    return <ResourceState source="unavailable" label="dashboard điều hành" error={error?.message ?? null} />;
  }

  return (
    <div className="stack">
      {usingFallback ? <ResourceState source="fallback" label="dashboard điều hành" error={error?.message ?? null} /> : null}
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
        <Card title="Top owner theo mức sử dụng">
          <DataTable
            columns={["Owner", "Committed", "Remaining"]}
            rows={data.topOwners.map((owner) => [owner.ownerName, formatCurrency(owner.committedAmount), formatCurrency(owner.remainingAmount)])}
          />
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
  );
}
