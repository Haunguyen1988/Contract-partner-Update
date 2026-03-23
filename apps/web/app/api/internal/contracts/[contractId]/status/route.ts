import { NextRequest, NextResponse } from "next/server";
import { createContractsService } from "../../../../../../src/server/services";
import { requireSession, handleRouteError } from "../../../../../../src/server/internal-api";
import { hasPermission } from "@contract/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const session = await requireSession(request);
    const { action, reason } = await request.json();
    const { contractId } = await params;
    const contractsService = createContractsService();

    let result;
    switch (action) {
      case "submit":
        if (!hasPermission(session.role, "CONTRACT_SUBMIT")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        result = await contractsService.submitForApproval(contractId, session.id);
        break;
      case "approve":
        if (!hasPermission(session.role, "CONTRACT_APPROVE")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        result = await contractsService.approve(contractId, session.id);
        break;
      case "reject":
        if (!hasPermission(session.role, "CONTRACT_APPROVE")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        result = await contractsService.reject(contractId, reason || "Không có lý do rõ ràng", session.id);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
