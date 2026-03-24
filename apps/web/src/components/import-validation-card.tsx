"use client";

import type { CSSProperties } from "react";
import { Card } from "@contract/ui";
import { AsyncActionButton } from "./async-action-button";
import { PageHeader } from "./page-header";

interface ImportValidationCardProps {
  buttonLabel: string;
  description: string;
  eyebrow: string;
  headerTitle: string;
  pending: boolean;
  pendingLabel: string;
  result: string;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onValidate: () => void | Promise<void>;
}

const RESULT_PANEL_STYLE: CSSProperties = {
  padding: 16,
  overflowX: "auto",
  background: "var(--bg-1)",
  boxShadow: "none"
};

export function ImportValidationCard({
  buttonLabel,
  description,
  eyebrow,
  headerTitle,
  pending,
  pendingLabel,
  result,
  title,
  value,
  onChange,
  onValidate
}: ImportValidationCardProps) {
  return (
    <Card title={title} eyebrow={eyebrow}>
      <PageHeader title={headerTitle} description={description} />
      <div className="field">
        <label>Nội dung CSV</label>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
      <div className="button-row">
        <AsyncActionButton
          className="button-primary"
          pending={pending}
          idleLabel={buttonLabel}
          pendingLabel={pendingLabel}
          onClick={onValidate}
        />
      </div>
      <pre className="panel" style={RESULT_PANEL_STYLE}>{result || "Chưa có kết quả."}</pre>
    </Card>
  );
}
