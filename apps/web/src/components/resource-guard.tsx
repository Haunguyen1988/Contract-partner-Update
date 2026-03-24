"use client";

import type { ReactNode } from "react";
import type { ResourcePageState } from "../lib/resource";
import { ResourceState } from "./resource-state";

interface ResourceGuardProps {
  children: ReactNode;
  label: string;
  state: ResourcePageState;
}

export function ResourceGuard({ children, label, state }: ResourceGuardProps) {
  if (state.source === "loading") {
    return <ResourceState source="loading" label={label} />;
  }

  if (state.source === "unavailable" && !state.hasData) {
    return <ResourceState source="unavailable" label={label} error={state.error} />;
  }

  return (
    <>
      {state.usingFallback ? <ResourceState source="fallback" label={label} error={state.error} /> : null}
      {children}
    </>
  );
}
