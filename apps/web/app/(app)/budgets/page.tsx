"use client";

import { useState } from "react";
import { Card, DataTable, ProgressBar, Column, PageHeader } from "@contract/ui";
import { apiRequest } from "../../../src/lib/api";
import { formatCurrency } from "../../../src/lib/format";
import { mockBudgets, mockUsers } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function BudgetsPage() {
  const { token } = useSession();
  const budgetsResource = useApiResource("/api/internal/budgets", mockBudgets);
  const usersResource = useApiResource("/api/internal/users", mockUsers);
  const budgets = budgetsResource.data ?? mockBudgets;
  const users = usersResource.data ?? mockUsers;
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    fiscalYear: "2026",
    ownerId: mockUsers[2]?.id ?? "",
    campaign: "GENERAL",
    allocatedAmount: ""
  });

  const columns: Column<any>[] = [
    { header: "Owner", accessor: (b) => b.ownerName },
    { header: "Fiscal year", accessor: (b) => String(b.fiscalYear) },
    { header: "Campaign", accessor: (b) => b.campaign },
    { header: "Phân bổ", accessor: (b) => formatCurrency(b.allocatedAmount) },
    { header: "Đã cam kết", accessor: (b) => formatCurrency(b.committedAmount) },
    { 
      header: "Còn lại & Tiến độ", 
      accessor: (b) => {
        const allocated = Number(b.allocatedAmount);
        const committed = Number(b.committedAmount);
        const percentage = allocated > 0 ? (committed / allocated) * 100 : 0;
        let tone: "success" | "warning" | "danger" = "success";
        if (percentage > 90) tone = "danger";
        else if (percentage > 70) tone = "warning";
        return (
          <div style={{ minWidth: "200px" }}>
            <ProgressBar
              value={committed}
              max={allocated}
              sublabel={`${formatCurrency(b.remainingAmount)} left`}
              tone={tone}
            />
          </div>
        );
      }
    }
  ];

  return (
    <div className="grid-2" style={{ padding: 24 }}>
      <Card>
        <div className="p-6">
          <PageHeader title="Cấp ngân sách" description="Mỗi budget được khóa theo fiscal year + owner + campaign." />
          <div className="stack" style={{ gap: 16, marginTop: 24 }}>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="field">
                <label className="text-sm font-medium mb-1 block">Fiscal year</label>
                <input className="input" value={form.fiscalYear} onChange={(event) => setForm({ ...form, fiscalYear: event.target.value })} />
              </div>
              <div className="field">
                <label className="text-sm font-medium mb-1 block">Owner</label>
                <select className="select" value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label className="text-sm font-medium mb-1 block">Campaign</label>
              <input className="input" value={form.campaign} onChange={(event) => setForm({ ...form, campaign: event.target.value })} />
            </div>
            <div className="field">
              <label className="text-sm font-medium mb-1 block">Allocated amount</label>
              <input className="input" type="number" value={form.allocatedAmount} onChange={(event) => setForm({ ...form, allocatedAmount: event.target.value })} />
            </div>
            {status && <div className="text-sm text-success">{status}</div>}
            <button
              className="button-primary"
              onClick={async () => {
                try {
                  await apiRequest("/api/internal/budgets", {
                    method: "POST",
                    body: JSON.stringify({
                      ...form,
                      fiscalYear: Number(form.fiscalYear),
                      allocatedAmount: Number(form.allocatedAmount)
                    })
                  }, token);
                  setStatus("Đã lưu budget allocation.");
                  budgetsResource.reload();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Thất bại.");
                }
              }}
            >
              Lưu ngân sách
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sổ ngân sách</h3>
          <DataTable data={budgets} columns={columns} />
        </div>
      </Card>
    </div>
  );
}
