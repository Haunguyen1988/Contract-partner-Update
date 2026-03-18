"use client";

import { useEffect, useState } from "react";
import type { ApiError, ResourceSource } from "./api";
import { fetchWithFallback } from "./api";
import { useSession } from "./session";

interface UseApiResourceOptions {
  allowFallback?: boolean;
}

export function useApiResource<T>(path: string, fallback: T, options?: UseApiResourceOptions) {
  const { token } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [source, setSource] = useState<ResourceSource>("loading");

  const allowFallback = options?.allowFallback;

  async function load() {
    if (data === null) {
      setSource("loading");
    }

    setLoading(true);
    const next = await fetchWithFallback(path, token, fallback, allowFallback);
    setData((current) => next.data ?? current);
    setError(next.error);
    setSource(next.source);
    setLoading(false);
  }

  useEffect(() => {
    void load();
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
