"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./app-shell";
import { useSession } from "../lib/session";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, token } = useSession();

  useEffect(() => {
    if (ready && !token) {
      router.replace("/login");
    }
  }, [ready, token, router]);

  if (!ready || !token) {
    return <div className="login-shell">Đang kiểm tra phiên đăng nhập...</div>;
  }

  return <AppShell>{children}</AppShell>;
}

