import type { Role } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireSession } from "../../../../../../src/server/internal-api";
import { createContractsService } from "../../../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT_ACTIVATE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER"];

interface RouteContext {
  params: Promise<{
    contractId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireSession(request, CONTRACT_ACTIVATE_ROLES);
    const { contractId } = await context.params;
    return NextResponse.json(await createContractsService().activate(contractId, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
