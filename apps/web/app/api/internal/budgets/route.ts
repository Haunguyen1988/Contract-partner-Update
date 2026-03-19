import type { Role } from "@contract/shared";
import { createBudgetAllocationSchema } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, parseJsonBody, requireSession } from "../../../../src/server/internal-api";
import { createBudgetsService } from "../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUDGET_READ_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "FINANCE", "LEADERSHIP"];
const BUDGET_WRITE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "FINANCE"];

export async function GET(request: NextRequest) {
  try {
    await requireSession(request, BUDGET_READ_ROLES);
    return NextResponse.json(await createBudgetsService().list());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession(request, BUDGET_WRITE_ROLES);
    const payload = await parseJsonBody(request, createBudgetAllocationSchema);
    return NextResponse.json(await createBudgetsService().upsert(payload, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
