"use client";

import { Card, DataTable, ProgressBar } from "@contract/ui";
import { ActionFeedback } from "../../../src/components/action-feedback";
import { AsyncActionButton } from "../../../src/components/async-action-button";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceGuard } from "../../../src/components/resource-guard";
import { apiRequest } from "../../../src/lib/api";
import { useAsyncAction } from "../../../src/lib/async-action";
import { formatCurrency } from "../../../src/lib/format";
import { useFormState } from "../../../src/lib/form-state";
import { mockBudgets, mockUsers } from "../../../src/lib/mocks";
import { getResourcePageState } from "../../../src/lib/resource";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function BudgetsPage() {
  const { token } = useSession();
  const budgetsResource = useApiResource("/api/internal/budgets", mockBudgets);
  const usersResource = useApiResource("/api/internal/users", mockUsers);
  const budgets = budgetsResource.data ?? mockBudgets;
  const users = usersResource.data ?? mockUsers;
  const pageState = getResourcePageState([budgetsResource, usersResource]);
  const saveBudgetAction = useAsyncAction();
  const budgetForm = useFormState({
    fiscalYear: "2026",
    ownerId: mockUsers[2]?.id ?? "",
    campaign: "GENERAL",
    allocatedAmount: ""
  });

  return (
    <ResourceGuard label="ngân sách" state={pageState}>
      <div className="grid-2">
        <Card title="Cấp ngân sách" eyebrow="Budget allocation">
          <div className="stack">
            <PageHeader title="Owner budget" description="Mỗi budget được khóa theo fiscal year + owner + campaign." />
            <div className="form-grid">
              <div className="field">
                <label>Fiscal year</label>
                <input {...budgetForm.bind("fiscalYear")} />
              </div>
              <div className="field">
                <label>Owner</label>
                <select {...budgetForm.bind("ownerId")}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Campaign</label>
                <input {...budgetForm.bind("campaign")} />
              </div>
              <div className="field">
                <label>Allocated amount</label>
                <input {...budgetForm.bind("allocatedAmount")} />
              </div>
            </div>
            <ActionFeedback feedback={saveBudgetAction.feedback} />
            <div className="button-row">
              <AsyncActionButton
                className="button-primary"
                pending={saveBudgetAction.pending}
                idleLabel="Lưu ngân sách"
                pendingLabel="Đang lưu..."
                onClick={async () => {
                  await saveBudgetAction.run(
                    () => apiRequest("/api/internal/budgets", {
                      method: "POST",
                      body: JSON.stringify({
                        ...budgetForm.values,
                        fiscalYear: Number(budgetForm.values.fiscalYear),
                        allocatedAmount: Number(budgetForm.values.allocatedAmount)
                      })
                    }, token),
                    {
                      errorMessage: "Không thể lưu budget.",
                      successMessage: "Đã lưu budget allocation.",
                      onSuccess: () => budgetsResource.reload()
                    }
                  );
                }}
              />
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
    </ResourceGuard>
  );
}
