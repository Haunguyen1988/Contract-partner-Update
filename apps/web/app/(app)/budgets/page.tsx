"use client";

import { useState } from "react";
import { Card, DataTable } from "@contract/ui";
import { PageHeader } from "../../../src/components/page-header";
import { apiRequest } from "../../../src/lib/api";
import { formatCurrency } from "../../../src/lib/format";
import { mockBudgets, mockUsers } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function BudgetsPage() {
  const { token } = useSession();
  const { data: budgets, reload } = useApiResource("/budgets", mockBudgets);
  const { data: users } = useApiResource("/users", mockUsers);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    fiscalYear: "2026",
    ownerId: mockUsers[2]?.id ?? "",
    campaign: "GENERAL",
    allocatedAmount: ""
  });

  return (
    <div className="grid-2">
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
                  await apiRequest("/budgets", {
                    method: "POST",
                    body: JSON.stringify({
                      ...form,
                      fiscalYear: Number(form.fiscalYear),
                      allocatedAmount: Number(form.allocatedAmount)
                    })
                  }, token);
                  setStatus("Đã lưu budget allocation.");
                  await reload();
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
          columns={["Owner", "Fiscal year", "Campaign", "Allocated", "Committed", "Remaining"]}
          rows={budgets.map((budget) => [
            budget.ownerName,
            String(budget.fiscalYear),
            budget.campaign,
            formatCurrency(budget.allocatedAmount),
            formatCurrency(budget.committedAmount),
            formatCurrency(budget.remainingAmount)
          ])}
        />
      </Card>
    </div>
  );
}

