"use client";

import { useState } from "react";
import { Badge, Card, DataTable } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { apiRequest } from "../../../src/lib/api";
import { formatDate } from "../../../src/lib/format";
import { mockAlerts } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function AlertsPage() {
  const { token } = useSession();
  const { data: alerts, reload } = useApiResource("/alerts", mockAlerts);
  const [status, setStatus] = useState("");

  return (
    <Card title="In-app alerts" eyebrow="Notification center">
      <PageHeader title="Cảnh báo và nhắc việc" description="Phase 1 dùng alert trung tâm trong ứng dụng, chưa gửi email hoặc Teams." />
      <div className={`status-text ${status ? "success" : ""}`}>{status}</div>
      <DataTable
        columns={["Tiêu đề", "Thông điệp", "Đến hạn", "Mức độ", "Trạng thái", "Action"]}
        rows={alerts.map((alert) => [
          alert.title,
          alert.message,
          formatDate(alert.dueDate),
          <Badge key={`${alert.id}-severity`} tone={alert.severity === "CRITICAL" ? "critical" : "warning"}>{alert.severity}</Badge>,
          <Badge key={`${alert.id}-status`} tone={alert.status === "OPEN" ? "warning" : "success"}>{alert.status}</Badge>,
          <button
            key={`${alert.id}-resolve`}
            className="button-ghost"
            onClick={async () => {
              try {
                await apiRequest(`/alerts/${alert.id}/resolve`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: "RESOLVED" })
                }, token);
                setStatus(`Đã resolve alert ${alert.id}.`);
                await reload();
              } catch (error) {
                setStatus(error instanceof Error ? error.message : "Không thể resolve alert.");
              }
            }}
          >
            Resolve
          </button>
        ])}
      />
    </Card>
  );
}

