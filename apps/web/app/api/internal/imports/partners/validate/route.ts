import type { Role } from "@contract/shared";
import { csvImportSchema } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, parseJsonBody, requireSession } from "../../../../../../src/server/internal-api";
import { createImportsService } from "../../../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMPORT_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF"];

export async function POST(request: NextRequest) {
  try {
    await requireSession(request, IMPORT_ROLES);
    const payload = await parseJsonBody(request, csvImportSchema);
    return NextResponse.json(await createImportsService().validatePartnerCsv(payload));
  } catch (error) {
    return handleRouteError(error);
  }
}
