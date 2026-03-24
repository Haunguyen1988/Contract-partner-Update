"use client";

import { Badge, Card, DataTable } from "@contract/ui";
import { ActionFeedback } from "../../../src/components/action-feedback";
import { AsyncActionButton } from "../../../src/components/async-action-button";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceGuard } from "../../../src/components/resource-guard";
import { apiRequest } from "../../../src/lib/api";
import { useAsyncAction } from "../../../src/lib/async-action";
import { formatDate } from "../../../src/lib/format";
import { mockAlerts } from "../../../src/lib/mocks";
import { getResourcePageState } from "../../../src/lib/resource";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function AlertsPage() {
  const { token } = useSession();
  const alertsResource = useApiResource("/api/internal/alerts", mockAlerts);
  const alerts = alertsResource.data ?? mockAlerts;
  const resolveAction = useAsyncAction();
  const pageState = getResourcePageState([alertsResource]);

  return (
    <ResourceGuard label="cảnh báo trong ứng dụng" state={pageState}>
      <Card title="In-app alerts" eyebrow="Notification center">
        <PageHeader title="Cảnh báo và nhắc việc" description="Phase 1 dùng alert trung tâm trong ứng dụng, chưa gửi email hoặc Teams." />
        <ActionFeedback feedback={resolveAction.feedback} />
        <DataTable
          columns={["Tiêu đề", "Thông điệp", "Đến hạn", "Mức độ", "Trạng thái", "Action"]}
          rows={alerts.map((alert) => [
            alert.title,
            alert.message,
            formatDate(alert.dueDate),
            <Badge key={`${alert.id}-severity`} tone={alert.severity === "CRITICAL" ? "critical" : "warning"}>{alert.severity}</Badge>,
            <Badge key={`${alert.id}-status`} tone={alert.status === "OPEN" ? "warning" : "success"}>{alert.status}</Badge>,
            <AsyncActionButton
              key={`${alert.id}-resolve`}
              className="button-ghost"
              pending={resolveAction.pending}
              idleLabel="Resolve"
              pendingLabel="Đang xử lý..."
              onClick={async () => {
                await resolveAction.run(
                  () => apiRequest(`/api/internal/alerts/${alert.id}/resolve`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "RESOLVED" })
                  }, token),
                  {
                    errorMessage: "Không thể resolve alert.",
                    successMessage: `Đã resolve alert ${alert.id}.`,
                    onSuccess: () => alertsResource.reload()
                  }
                );
              }}
            />
          ])}
        />
      </Card>
    </ResourceGuard>
  );
}
