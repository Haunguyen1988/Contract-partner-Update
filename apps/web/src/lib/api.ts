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

function isErrorWithName(error: unknown, name: string): error is Error {
  return error instanceof Error && error.name === name;
}

export function isAbortError(error: unknown): boolean {
  return isErrorWithName(error, "AbortError");
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

async function readJsonSafely(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function createApiError(response: Response): Promise<ApiError> {
  const fallbackMessage = `Request failed with status ${response.status}`;
  const errorPayload = await readJsonSafely(response.clone());

  if (
    errorPayload &&
    typeof errorPayload === "object" &&
    "message" in errorPayload &&
    typeof errorPayload.message === "string"
  ) {
    return new ApiError(errorPayload.message, errorPayload);
  }

  const responseText = (await response.text()).trim();

  if (responseText) {
    return new ApiError(responseText, errorPayload ?? responseText);
  }

  return new ApiError(fallbackMessage, errorPayload);
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  const responseText = await response.text();
  return (responseText || null) as T;
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
    throw await createApiError(response);
  }

  return parseResponseBody<T>(response);
}

export async function fetchWithFallback<T>(
  path: string,
  token: string | null,
  fallback: T,
  allowFallback = MOCK_FALLBACK_ENABLED,
  signal?: AbortSignal
): Promise<FetchWithFallbackResult<T>> {
  try {
    const data = await apiRequest<T>(path, { method: "GET", signal }, token);
    return {
      data,
      error: null,
      source: "api"
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

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
