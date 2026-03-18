"use client";

import { useEffect, useState } from "react";
import { Badge, Card } from "@contract/ui";
import { getSupabaseProjectRef, hasSupabaseBrowserConfig } from "../lib/supabase/config";

interface RuntimeStatus {
  supabaseBrowserConfigured: boolean;
  supabaseUrl: string | null;
  prismaDatabaseConfigured: boolean;
  prismaDirectConfigured: boolean;
  apiUrl: string | null;
}

const fallbackStatus: RuntimeStatus = {
  supabaseBrowserConfigured: hasSupabaseBrowserConfig(),
  supabaseUrl: null,
  prismaDatabaseConfigured: false,
  prismaDirectConfigured: false,
  apiUrl: null
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

  const projectRef = getSupabaseProjectRef();

  if (compact) {
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Badge tone={status.supabaseBrowserConfigured ? "success" : "warning"}>
          {status.supabaseBrowserConfigured ? "Supabase web configured" : "Supabase web missing"}
        </Badge>
        <Badge tone={status.prismaDatabaseConfigured && status.prismaDirectConfigured ? "success" : "warning"}>
          {status.prismaDatabaseConfigured && status.prismaDirectConfigured ? "Prisma DB ready" : "Prisma DB pending"}
        </Badge>
      </div>
    );
  }

  return (
    <Card title="Integration status" eyebrow="Supabase + Vercel readiness">
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          Supabase project ref: <strong>{projectRef ?? "Chưa nhận diện"}</strong>
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Badge tone={status.supabaseBrowserConfigured ? "success" : "warning"}>
            {status.supabaseBrowserConfigured ? "Supabase browser config OK" : "Thiếu NEXT_PUBLIC Supabase env"}
          </Badge>
          <Badge tone={status.prismaDatabaseConfigured ? "success" : "warning"}>
            {status.prismaDatabaseConfigured ? "DATABASE_URL OK" : "DATABASE_URL chưa hoàn chỉnh"}
          </Badge>
          <Badge tone={status.prismaDirectConfigured ? "success" : "warning"}>
            {status.prismaDirectConfigured ? "DIRECT_URL OK" : "DIRECT_URL chưa hoàn chỉnh"}
          </Badge>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Web app can now use your Supabase project URL and anon key. The current login flow still depends on the Nest API and Prisma,
          so we still need the Supabase Postgres connection strings from the Supabase Connect panel to make backend login fully work.
        </p>
      </div>
    </Card>
  );
}
