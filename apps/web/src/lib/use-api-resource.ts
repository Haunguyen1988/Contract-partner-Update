"use client";

import { useEffect, useRef, useState } from "react";
import type { ResourceSource } from "./api";
import { ApiError, fetchWithFallback, isAbortError } from "./api";
import { useSession } from "./session";

interface UseApiResourceOptions {
  allowFallback?: boolean;
}

export function useApiResource<T>(path: string, fallback: T, options?: UseApiResourceOptions) {
  const { token } = useSession();
  const requestIdRef = useRef(0);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [source, setSource] = useState<ResourceSource>("loading");

  const allowFallback = options?.allowFallback;

  async function load(signal?: AbortSignal) {
    const requestId = ++requestIdRef.current;

    if (data === null) {
      setSource("loading");
    }

    setLoading(true);
    try {
      const next = await fetchWithFallback(path, token, fallback, allowFallback, signal);

      if (signal?.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setData((current) => next.data ?? current);
      setError(next.error);
      setSource(next.source);
    } catch (error) {
      if (isAbortError(error) || requestId !== requestIdRef.current) {
        return;
      }

      setError(error instanceof ApiError ? error : new ApiError("Request failed unexpectedly."));
      setSource("unavailable");
    } finally {
      if (!signal?.aborted && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [allowFallback, path, token]);

  return {
    data,
    error,
    loading,
    source,
    usingFallback: source === "fallback",
    reload: load
  };
}
