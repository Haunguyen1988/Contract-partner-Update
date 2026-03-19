import type { Role } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireSession } from "../../../../src/server/internal-api";
import { createAlertsService } from "../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALERT_READ_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"];

export async function GET(request: NextRequest) {
  try {
    const user = await requireSession(request, ALERT_READ_ROLES);
    return NextResponse.json(await createAlertsService().list(user));
  } catch (error) {
    return handleRouteError(error);
  }
}
