export const supabaseBrowserConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
};

export function hasSupabaseBrowserConfig() {
  return Boolean(supabaseBrowserConfig.url && supabaseBrowserConfig.publishableKey);
}

export function getSupabaseProjectRef() {
  if (!supabaseBrowserConfig.url) {
    return null;
  }

  try {
    const hostname = new URL(supabaseBrowserConfig.url).hostname;
    return hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

