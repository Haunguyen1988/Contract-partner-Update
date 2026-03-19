"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const MOCK_FALLBACK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK === "true";

export type ResourceSource = "loading" | "api" | "fallback" | "unavailable";

export class ApiError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
  }
}

export interface FetchWithFallbackResult<T> {
  data: T | null;
  error: ApiError | null;
  source: Exclude<ResourceSource, "loading">;
}

export function isMockFallbackEnabled() {
  return MOCK_FALLBACK_ENABLED;
}

export function mergeResourceSources(sources: ResourceSource[]): ResourceSource {
  if (sources.includes("unavailable")) {
    return "unavailable";
  }

  if (sources.includes("loading")) {
    return "loading";
  }

  if (sources.includes("fallback")) {
    return "fallback";
  }

  return "api";
}

function resolveRequestUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/api/")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(resolveRequestUrl(path), {
    ...init,
    headers
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    try {
      const errorPayload = await response.json();
      throw new ApiError(errorPayload.message ?? fallbackMessage, errorPayload);
    } catch {
      throw new ApiError(fallbackMessage);
    }
  }

  return response.json() as Promise<T>;
}

export async function fetchWithFallback<T>(
  path: string,
  token: string | null,
  fallback: T,
  allowFallback = MOCK_FALLBACK_ENABLED
): Promise<FetchWithFallbackResult<T>> {
  try {
    const data = await apiRequest<T>(path, { method: "GET" }, token);
    return {
      data,
      error: null,
      source: "api"
    };
  } catch (error) {
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(error instanceof Error ? error.message : "Request failed unexpectedly.");

    if (allowFallback) {
      return {
        data: fallback,
        error: apiError,
        source: "fallback"
      };
    }

    return {
      data: null,
      error: apiError,
      source: "unavailable"
    };
  }
}
