import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabaseBrowserConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    prismaDatabaseConfigured: !String(process.env.DATABASE_URL ?? "").includes("[PROJECT-REF]"),
    prismaDirectConfigured: !String(process.env.DIRECT_URL ?? "").includes("[PROJECT-REF]"),
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? null
  });
}

