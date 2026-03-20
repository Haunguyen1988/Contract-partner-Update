"use client";

import { Card, DataTable, Column, PageHeader } from "@contract/ui";
import { formatDate } from "../../../src/lib/format";
import { mockAuditLogs } from "../../../src/lib/mocks";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function AuditPage() {
  const auditResource = useApiResource("/api/internal/audit", mockAuditLogs);
  const data = auditResource.data ?? mockAuditLogs;

  const columns: Column<any>[] = [
    { header: "Thời điểm", accessor: (log) => formatDate(log.changedAt) },
    { header: "Action", accessor: (log) => log.action },
    { header: "Entity", accessor: (log) => `${log.entityType} / ${log.entityId}` },
    { header: "Người thay đổi", accessor: (log) => log.changedBy ?? "System" },
    { header: "Tóm tắt", accessor: (log) => JSON.stringify(log.diffSummary) }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Lịch sử thay đổi" 
        description="Theo dõi những thay đổi quan trọng cho contract, partner, budget, settings và documents." 
      />
      <Card>
        <DataTable data={data} columns={columns} />
      </Card>
    </div>
  );
}
