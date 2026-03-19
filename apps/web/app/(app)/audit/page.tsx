"use client";

import { Card, DataTable } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceState } from "../../../src/components/resource-state";
import { formatDate } from "../../../src/lib/format";
import { mockAuditLogs } from "../../../src/lib/mocks";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function AuditPage() {
  const auditResource = useApiResource("/api/internal/audit", mockAuditLogs);
  const data = auditResource.data ?? mockAuditLogs;

  if (auditResource.source === "loading") {
    return <ResourceState source="loading" label="nhật ký audit" />;
  }

  if (auditResource.source === "unavailable" && !auditResource.data) {
    return <ResourceState source="unavailable" label="nhật ký audit" error={auditResource.error?.message ?? null} />;
  }

  return (
    <Card title="Audit log" eyebrow="Traceability">
      {auditResource.usingFallback ? <ResourceState source="fallback" label="nhật ký audit" error={auditResource.error?.message ?? null} /> : null}
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
  );
}
