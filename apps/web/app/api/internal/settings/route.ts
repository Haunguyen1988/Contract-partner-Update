import type { Role } from "@contract/shared";
import { appSettingsSchema } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, parseJsonBody, requireSession } from "../../../../src/server/internal-api";
import { createSettingsService } from "../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTINGS_READ_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "FINANCE"];
const SETTINGS_WRITE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER"];

export async function GET(request: NextRequest) {
  try {
    await requireSession(request, SETTINGS_READ_ROLES);
    return NextResponse.json(await createSettingsService().getSettings());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSession(request, SETTINGS_WRITE_ROLES);
    const payload = await parseJsonBody(request, appSettingsSchema);
    return NextResponse.json(await createSettingsService().updateSettings(payload, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
