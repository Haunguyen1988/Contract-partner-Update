"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseBrowserConfig, supabaseBrowserConfig } from "./config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseBrowserConfig()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(
      supabaseBrowserConfig.url,
      supabaseBrowserConfig.publishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  return browserClient;
}

