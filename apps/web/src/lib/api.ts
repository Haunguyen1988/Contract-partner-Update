"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
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

export async function fetchWithFallback<T>(path: string, token: string | null, fallback: T): Promise<T> {
  try {
    return await apiRequest<T>(path, { method: "GET" }, token);
  } catch {
    return fallback;
  }
}
