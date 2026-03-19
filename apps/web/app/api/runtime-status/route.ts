import { NextResponse } from "next/server";

function hasConfiguredDatabaseUrl(value: string | undefined) {
  const normalized = String(value ?? "").trim();

  return normalized.startsWith("postgresql://")
    && !normalized.includes("[DB_")
    && !normalized.includes("[PROJECT-REF]");
}

function hasConfiguredUploadDir(value: string | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 && !normalized.includes("[UPLOAD_");
}

export async function GET() {
  return NextResponse.json({
    deploymentMode: "internal-only",
    databaseConfigured: hasConfiguredDatabaseUrl(process.env.DATABASE_URL),
    directDatabaseConfigured: hasConfiguredDatabaseUrl(process.env.DIRECT_URL),
    uploadDirConfigured: hasConfiguredUploadDir(process.env.UPLOAD_DIR),
    uploadDir: process.env.UPLOAD_DIR ?? null,
    apiConfigured: Boolean(process.env.NEXT_PUBLIC_API_URL),
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? null,
    mockFallbackEnabled: process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK === "true"
  });
}
