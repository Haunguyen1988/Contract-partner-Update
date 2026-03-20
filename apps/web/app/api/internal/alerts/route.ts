import { NextRequest, NextResponse } from "next/server";
import { createAlertsService } from "../../../../src/server/services";
import { requireSession, handleRouteError } from "../../../../src/server/internal-api";
import { hasPermission } from "@contract/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);

    if (!hasPermission(session.role, "ALERT_VIEW")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const alertsService = createAlertsService();
    const alerts = await alertsService.list({
      id: session.id,
      role: session.role as any
    });

    return NextResponse.json(alerts);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession(request);
    const alertsService = createAlertsService();
    
    await alertsService.syncContractExpiryAlerts();
    await alertsService.syncBudgetOverageAlerts();
    await alertsService.syncMissingDocumentAlerts();

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
