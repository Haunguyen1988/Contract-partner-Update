"use client";

import { useEffect } from "react";
import { Card } from "@contract/ui";
import { ActionFeedback } from "../../../src/components/action-feedback";
import { AsyncActionButton } from "../../../src/components/async-action-button";
import { IntegrationStatus } from "../../../src/components/integration-status";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceGuard } from "../../../src/components/resource-guard";
import { apiRequest } from "../../../src/lib/api";
import { useAsyncAction } from "../../../src/lib/async-action";
import { useFormState } from "../../../src/lib/form-state";
import { mockSettings } from "../../../src/lib/mocks";
import { getResourcePageState } from "../../../src/lib/resource";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

function parseExpiryLeadDays(input: string) {
  return input
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => !Number.isNaN(item));
}

export default function SettingsPage() {
  const { token } = useSession();
  const settingsResource = useApiResource("/api/internal/settings", mockSettings);
  const data = settingsResource.data ?? mockSettings;
  const settingsForm = useFormState({
    policy: mockSettings.budgetOverrunPolicy,
    leadDays: mockSettings.expiryLeadDays.join(",")
  });
  const saveSettingsAction = useAsyncAction();

  useEffect(() => {
    settingsForm.reset({
      policy: data.budgetOverrunPolicy,
      leadDays: data.expiryLeadDays.join(",")
    });
  }, [data]);
  const pageState = getResourcePageState([settingsResource]);

  return (
    <ResourceGuard label="cấu hình hệ thống" state={pageState}>
      <Card title="System settings" eyebrow="Admin control">
        <IntegrationStatus />
        <PageHeader title="Cấu hình MVP" description="Hiện tại chỉ mở policy budget overrun và lịch cảnh báo contract expiry." />
        <div className="form-grid">
          <div className="field">
            <label>Budget overrun policy</label>
            <select {...settingsForm.bind("policy")}>
              <option value="WARN">WARN</option>
              <option value="BLOCK">BLOCK</option>
            </select>
          </div>
          <div className="field">
            <label>Expiry lead days</label>
            <input {...settingsForm.bind("leadDays")} />
          </div>
        </div>
        <ActionFeedback feedback={saveSettingsAction.feedback} />
        <div className="button-row">
          <AsyncActionButton
            className="button-primary"
            pending={saveSettingsAction.pending}
            idleLabel="Lưu cấu hình"
            pendingLabel="Đang lưu..."
            onClick={async () => {
              await saveSettingsAction.run(
                () => apiRequest("/api/internal/settings", {
                  method: "PATCH",
                  body: JSON.stringify({
                    budgetOverrunPolicy: settingsForm.values.policy,
                    expiryLeadDays: parseExpiryLeadDays(settingsForm.values.leadDays)
                  })
                }, token),
                {
                  errorMessage: "Không thể lưu cấu hình.",
                  successMessage: "Đã cập nhật cấu hình hệ thống.",
                  onSuccess: () => settingsResource.reload()
                }
              );
            }}
          />
        </div>
      </Card>
    </ResourceGuard>
  );
}
