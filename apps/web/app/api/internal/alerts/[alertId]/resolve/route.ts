import type { Role } from "@contract/shared";
import { alertResolutionSchema } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, parseJsonBody, requireSession } from "../../../../../../src/server/internal-api";
import { createAlertsService } from "../../../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALERT_RESOLVE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE"];

interface RouteContext {
  params: Promise<{
    alertId: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireSession(request, ALERT_RESOLVE_ROLES);
    const payload = await parseJsonBody(request, alertResolutionSchema);
    const { alertId } = await context.params;
    return NextResponse.json(await createAlertsService().resolve(alertId, payload, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
