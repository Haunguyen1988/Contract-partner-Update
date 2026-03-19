"use client";

import { useEffect, useState } from "react";
import { Card } from "@contract/ui";
import { IntegrationStatus } from "../../../src/components/integration-status";
import { PageHeader } from "../../../src/components/page-header";
import { ResourceState } from "../../../src/components/resource-state";
import { apiRequest } from "../../../src/lib/api";
import { mockSettings } from "../../../src/lib/mocks";
import { useSession } from "../../../src/lib/session";
import { useApiResource } from "../../../src/lib/use-api-resource";

export default function SettingsPage() {
  const { token } = useSession();
  const settingsResource = useApiResource("/api/internal/settings", mockSettings);
  const data = settingsResource.data ?? mockSettings;
  const [policy, setPolicy] = useState(mockSettings.budgetOverrunPolicy);
  const [leadDays, setLeadDays] = useState(mockSettings.expiryLeadDays.join(","));
  const [status, setStatus] = useState("");

  useEffect(() => {
    setPolicy(data.budgetOverrunPolicy);
    setLeadDays(data.expiryLeadDays.join(","));
  }, [data]);

  if (settingsResource.source === "loading") {
    return <ResourceState source="loading" label="cấu hình hệ thống" />;
  }

  if (settingsResource.source === "unavailable" && !settingsResource.data) {
    return <ResourceState source="unavailable" label="cấu hình hệ thống" error={settingsResource.error?.message ?? null} />;
  }

  return (
    <Card title="System settings" eyebrow="Admin control">
      {settingsResource.usingFallback ? <ResourceState source="fallback" label="cấu hình hệ thống" error={settingsResource.error?.message ?? null} /> : null}
      <IntegrationStatus />
      <PageHeader title="Cấu hình MVP" description="Hiện tại chỉ mở policy budget overrun và lịch cảnh báo contract expiry." />
      <div className="form-grid">
        <div className="field">
          <label>Budget overrun policy</label>
          <select value={policy} onChange={(event) => setPolicy(event.target.value as "WARN" | "BLOCK")}>
            <option value="WARN">WARN</option>
            <option value="BLOCK">BLOCK</option>
          </select>
        </div>
        <div className="field">
          <label>Expiry lead days</label>
          <input value={leadDays} onChange={(event) => setLeadDays(event.target.value)} />
        </div>
      </div>
      <div className={`status-text ${status ? "success" : ""}`}>{status}</div>
      <div className="button-row">
        <button
          className="button-primary"
          onClick={async () => {
            try {
              await apiRequest("/api/internal/settings", {
                method: "PATCH",
                body: JSON.stringify({
                  budgetOverrunPolicy: policy,
                  expiryLeadDays: leadDays.split(",").map((item) => Number(item.trim())).filter((item) => !Number.isNaN(item))
                })
              }, token);
              setStatus("Đã cập nhật cấu hình hệ thống.");
              await settingsResource.reload();
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "Không thể lưu cấu hình.");
            }
          }}
        >
          Lưu cấu hình
        </button>
      </div>
    </Card>
  );
}
