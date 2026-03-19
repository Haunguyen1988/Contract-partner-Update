"use client";

import { useEffect, useState } from "react";
import { Badge, Card } from "@contract/ui";
import { isMockFallbackEnabled } from "../lib/api";
interface RuntimeStatus {
  deploymentMode: string;
  databaseConfigured: boolean;
  directDatabaseConfigured: boolean;
  uploadDirConfigured: boolean;
  uploadDir: string | null;
  apiConfigured: boolean;
  apiUrl: string | null;
  mockFallbackEnabled: boolean;
}

const fallbackStatus: RuntimeStatus = {
  deploymentMode: "internal-only",
  databaseConfigured: false,
  directDatabaseConfigured: false,
  uploadDirConfigured: false,
  uploadDir: null,
  apiConfigured: Boolean(process.env.NEXT_PUBLIC_API_URL),
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? null,
  mockFallbackEnabled: isMockFallbackEnabled()
};

export function IntegrationStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<RuntimeStatus>(fallbackStatus);

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch("/api/runtime-status", { cache: "no-store" });
        const payload = await response.json() as RuntimeStatus;
        setStatus(payload);
      } catch {
        setStatus(fallbackStatus);
      }
    }

    void loadStatus();
  }, []);

  if (compact) {
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Badge tone={status.databaseConfigured ? "success" : "warning"}>
          {status.databaseConfigured ? "Database ready" : "Database pending"}
        </Badge>
        <Badge tone={status.directDatabaseConfigured ? "success" : "warning"}>
          {status.directDatabaseConfigured ? "Direct URL OK" : "Direct URL pending"}
        </Badge>
        <Badge tone={status.uploadDirConfigured ? "success" : "warning"}>
          {status.uploadDirConfigured ? "Upload storage OK" : "Upload storage missing"}
        </Badge>
        <Badge tone={status.apiConfigured ? "success" : "warning"}>
          {status.apiConfigured ? "API URL OK" : "API URL missing"}
        </Badge>
        <Badge tone={status.mockFallbackEnabled ? "warning" : "success"}>
          {status.mockFallbackEnabled ? "Mock fallback ON" : "Real data only"}
        </Badge>
      </div>
    );
  }

  return (
    <Card title="System status" eyebrow="Internal deployment readiness">
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          Deployment mode: <strong>{status.deploymentMode}</strong>
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Badge tone={status.databaseConfigured ? "success" : "warning"}>
            {status.databaseConfigured ? "DATABASE_URL OK" : "DATABASE_URL pending"}
          </Badge>
          <Badge tone={status.directDatabaseConfigured ? "success" : "warning"}>
            {status.directDatabaseConfigured ? "DIRECT_URL OK" : "DIRECT_URL pending"}
          </Badge>
          <Badge tone={status.uploadDirConfigured ? "success" : "warning"}>
            {status.uploadDirConfigured ? "UPLOAD_DIR OK" : "UPLOAD_DIR missing"}
          </Badge>
          <Badge tone={status.apiConfigured ? "success" : "warning"}>
            {status.apiConfigured ? "NEXT_PUBLIC_API_URL OK" : "NEXT_PUBLIC_API_URL missing"}
          </Badge>
          <Badge tone={status.mockFallbackEnabled ? "warning" : "success"}>
            {status.mockFallbackEnabled ? "Mock fallback enabled" : "Real data default"}
          </Badge>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          The app is aligned with an internal-only deployment: Next.js web, Nest API, self-hosted Postgres, and local or shared upload
          storage.
        </p>
        {status.apiUrl ? (
          <p className="muted" style={{ margin: 0 }}>
            API endpoint: <strong>{status.apiUrl}</strong>
          </p>
        ) : null}
        {status.uploadDir ? (
          <p className="muted" style={{ margin: 0 }}>
            Upload directory: <strong>{status.uploadDir}</strong>
          </p>
        ) : null}
        <p className="muted" style={{ margin: 0 }}>
          Live API data is the default. Mock/demo data only appears when `NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=true`.
        </p>
      </div>
    </Card>
  );
}
