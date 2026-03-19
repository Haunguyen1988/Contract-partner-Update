import type { Role } from "@contract/shared";
import { createContractSchema } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, parseJsonBody, requireSession } from "../../../../src/server/internal-api";
import { createContractsService } from "../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT_READ_ROLES: Role[] = [
  "ADMIN",
  "PR_COR_MANAGER",
  "PR_COR_STAFF",
  "FINANCE",
  "LEGAL",
  "PROCUREMENT",
  "LEADERSHIP"
];

const CONTRACT_WRITE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF"];

export async function GET(request: NextRequest) {
  try {
    await requireSession(request, CONTRACT_READ_ROLES);
    return NextResponse.json(await createContractsService().list());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession(request, CONTRACT_WRITE_ROLES);
    const payload = await parseJsonBody(request, createContractSchema);
    return NextResponse.json(await createContractsService().create(payload, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
