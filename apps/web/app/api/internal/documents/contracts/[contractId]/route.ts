import type { Role } from "@contract/shared";
import { contractDocumentMetadataSchema } from "@contract/shared";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, requireSession } from "../../../../../../src/server/internal-api";
import { createDocumentsService } from "../../../../../../src/server/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCUMENT_UPLOAD_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF"];

interface RouteContext {
  params: Promise<{
    contractId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireSession(request, DOCUMENT_UPLOAD_ROLES);
    const { contractId } = await context.params;
    const formData = await request.formData();
    const rawFile = formData.get("file");

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ message: "Thieu file upload." }, { status: 400 });
    }

    const metadata = contractDocumentMetadataSchema.parse({
      type: formData.get("type"),
      filename: rawFile.name,
      mimeType: rawFile.type || "application/octet-stream",
      size: rawFile.size
    });

    const file = {
      originalName: rawFile.name,
      mimeType: rawFile.type || "application/octet-stream",
      size: rawFile.size,
      buffer: new Uint8Array(await rawFile.arrayBuffer())
    };

    return NextResponse.json(
      await createDocumentsService().upload(contractId, metadata, file, user.id)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
