import type { Role } from "@contract/shared";
import { contractDocumentMetadataSchema } from "@contract/shared";
import { NextResponse } from "next/server";
import {
  defineAuthorizedRoute,
  resolveRouteParams
} from "../../../../../../src/server/internal-api";
import { documentsService } from "../../../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../../../src/server/internal-api";

const DOCUMENT_UPLOAD_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF"];

interface RouteContext {
  params: Promise<{
    contractId: string;
  }>;
}

export const POST = defineAuthorizedRoute<RouteContext>(
  DOCUMENT_UPLOAD_ROLES,
  async ({ request, user, context }) => {
    const { contractId } = await resolveRouteParams(context);
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

    return documentsService.upload(contractId, metadata, file, user.id);
  }
);
