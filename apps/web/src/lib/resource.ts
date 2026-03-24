"use client";

import type { ApiError, ResourceSource } from "./api";
import { mergeResourceSources } from "./api";

interface ResourceSnapshot {
  data: unknown;
  error: ApiError | null;
  source: ResourceSource;
}

export interface ResourcePageState {
  error: string | null;
  hasData: boolean;
  source: ResourceSource;
  usingFallback: boolean;
}

export function getResourcePageState(resources: ResourceSnapshot[]): ResourcePageState {
  return {
    error: resources.find((resource) => resource.error)?.error?.message ?? null,
    hasData: resources.some((resource) => resource.data !== null),
    source: mergeResourceSources(resources.map((resource) => resource.source)),
    usingFallback: resources.some((resource) => resource.source === "fallback")
  };
}
