"use client";

import { Card, DataTable } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceGuard } from "../../../src/components/resource-guard";
import { formatDate } from "../../../src/lib/format";
import { mockAuditLogs } from "../../../src/lib/mocks";
import { getResourcePageState } from "../../../src/lib/resource";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function AuditPage() {
  const auditResource = useApiResource("/api/internal/audit", mockAuditLogs);
  const data = auditResource.data ?? mockAuditLogs;
  const pageState = getResourcePageState([auditResource]);

  return (
    <ResourceGuard label="nhật ký audit" state={pageState}>
      <Card title="Audit log" eyebrow="Traceability">
        <PageHeader title="Lịch sử thay đổi" description="Theo dõi những thay đổi quan trọng cho contract, partner, budget, settings và documents." />
        <DataTable
          columns={["Thời điểm", "Action", "Entity", "Người thay đổi", "Tóm tắt"]}
          rows={data.map((log) => [
            formatDate(log.changedAt),
            log.action,
            `${log.entityType} / ${log.entityId}`,
            log.changedBy ?? "System",
            JSON.stringify(log.diffSummary)
          ])}
        />
      </Card>
    </ResourceGuard>
  );
}
