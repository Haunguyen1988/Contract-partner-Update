import type { Role } from "@contract/shared";
import { csvImportSchema } from "@contract/shared";
import {
  defineAuthorizedRoute,
  parseJsonBody
} from "../../../../../../src/server/internal-api";
import { importsService } from "../../../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../../../src/server/internal-api";

const IMPORT_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF"];

export const POST = defineAuthorizedRoute(
  IMPORT_ROLES,
  async ({ request }) => importsService.validateContractCsv(
    await parseJsonBody(request, csvImportSchema)
  )
);
