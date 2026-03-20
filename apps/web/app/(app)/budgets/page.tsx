"use client";

import { useState } from "react";
import { Card, DataTable, ProgressBar } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceState } from "../../../src/components/resource-state";
import { apiRequest, mergeResourceSources } from "../../../src/lib/api";
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
  const pageSource = mergeResourceSources([budgetsResource.source, usersResource.source]);
  const pageError = budgetsResource.error?.message ?? usersResource.error?.message ?? null;
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    fiscalYear: "2026",
    ownerId: mockUsers[2]?.id ?? "",
    campaign: "GENERAL",
    allocatedAmount: ""
  });

  if (pageSource === "loading") {
    return <ResourceState source={pageSource} label="ngân sách" />;
  }

  if (pageSource === "unavailable" && !budgetsResource.data && !usersResource.data) {
    return <ResourceState source="unavailable" label="ngân sách" error={pageError} />;
  }

  return (
    <div className="grid-2">
      {pageSource === "fallback" ? <ResourceState source="fallback" label="ngân sách" error={pageError} /> : null}
      <Card title="Cấp ngân sách" eyebrow="Budget allocation">
        <div className="stack">
          <PageHeader title="Owner budget" description="Mỗi budget được khóa theo fiscal year + owner + campaign." />
          <div className="form-grid">
            <div className="field">
              <label>Fiscal year</label>
              <input value={form.fiscalYear} onChange={(event) => setForm({ ...form, fiscalYear: event.target.value })} />
            </div>
            <div className="field">
              <label>Owner</label>
              <select value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.fullName}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Campaign</label>
              <input value={form.campaign} onChange={(event) => setForm({ ...form, campaign: event.target.value })} />
            </div>
            <div className="field">
              <label>Allocated amount</label>
              <input value={form.allocatedAmount} onChange={(event) => setForm({ ...form, allocatedAmount: event.target.value })} />
            </div>
          </div>
          <div className={`status-text ${status ? "success" : ""}`}>{status}</div>
          <div className="button-row">
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
                  await budgetsResource.reload();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Không thể lưu budget.");
                }
              }}
            >
              Lưu ngân sách
            </button>
          </div>
        </div>
      </Card>

      <Card title="Sổ ngân sách" eyebrow="Budget register">
        <DataTable
          columns={["Owner", "Fiscal year", "Campaign", "Phân bổ", "Đã cam kết", "Còn lại & Tiến độ"]}
          rows={budgets.map((budget) => {
            const allocated = Number(budget.allocatedAmount);
            const committed = Number(budget.committedAmount);
            const percentage = allocated > 0 ? (committed / allocated) * 100 : 0;
            
            let tone: "success" | "warning" | "danger" = "success";
            if (percentage > 90) tone = "danger";
            else if (percentage > 70) tone = "warning";

            return [
              budget.ownerName,
              String(budget.fiscalYear),
              budget.campaign,
              formatCurrency(allocated),
              formatCurrency(committed),
              <div key={budget.id} style={{ minWidth: "200px" }}>
                <ProgressBar
                  value={committed}
                  max={allocated}
                  sublabel={`${formatCurrency(budget.remainingAmount)} left`}
                  tone={tone}
                />
              </div>
            ];
          })}
        />
      </Card>
    </div>
  );
}
