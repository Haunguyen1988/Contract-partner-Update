"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ViewerRole = "manager" | "staff" | "guest";

interface ViewerAccess {
  loading: boolean;
  role: ViewerRole;
  ownerId: string | null;
  displayName: string;
  isDemo: boolean;
}

function normalizeRole(value: unknown): ViewerRole {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized.includes("manager") ||
    normalized.includes("lead") ||
    normalized.includes("admin")
  ) {
    return "manager";
  }

  if (
    normalized.includes("staff") ||
    normalized.includes("executive") ||
    normalized.includes("specialist")
  ) {
    return "staff";
  }

  return "guest";
}

function pickProfileValue(profile: Record<string, unknown> | null, keys: string[]) {
  if (!profile) {
    return null;
  }

  for (const key of keys) {
    const value = profile[key];
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return null;
}

export function useViewerAccess(): ViewerAccess {
  const [state, setState] = useState<ViewerAccess>({
    loading: true,
    role: "manager",
    ownerId: null,
    displayName: "Demo Manager",
    isDemo: true
  });

  useEffect(() => {
    let active = true;

    async function loadViewer() {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        if (active) {
          setState({
            loading: false,
            role: "manager",
            ownerId: null,
            displayName: "Demo Manager",
            isDemo: true
          });
        }
        return;
      }

      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
          if (active) {
            setState({
              loading: false,
              role: "manager",
              ownerId: null,
              displayName: "Demo Manager",
              isDemo: true
            });
          }
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .limit(1)
          .maybeSingle();

        const rawRole = pickProfileValue(profile, [
          "role",
          "user_role",
          "access_role",
          "position"
        ]);

        const normalizedRole = normalizeRole(rawRole) || "staff";
        const displayName =
          String(
            pickProfileValue(profile, [
              "full_name",
              "display_name",
              "name",
              "email"
            ]) || user.email || "Nhân sự nội bộ"
          ) || "Nhân sự nội bộ";

        if (active) {
          setState({
            loading: false,
            role: normalizedRole === "guest" ? "staff" : normalizedRole,
            ownerId: user.id,
            displayName,
            isDemo: false
          });
        }
      } catch {
        if (active) {
          setState({
            loading: false,
            role: "manager",
            ownerId: null,
            displayName: "Demo Manager",
            isDemo: true
          });
        }
      }
    }

    loadViewer();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
