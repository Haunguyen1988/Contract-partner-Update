"use client";

import { useEffect, useState } from "react";
import { fetchWithFallback } from "./api";
import { useSession } from "./session";

export function useApiResource<T>(path: string, fallback: T) {
  const { token } = useSession();
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const next = await fetchWithFallback(path, token, fallback);
    setData(next);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [path, token]);

  return {
    data,
    loading,
    reload: load
  };
}

