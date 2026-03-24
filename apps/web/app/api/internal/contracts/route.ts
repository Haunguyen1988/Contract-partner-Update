import type { Role } from "@contract/shared";
import { createContractSchema } from "@contract/shared";
import {
  defineAuthorizedRoute,
  parseJsonBody
} from "../../../../src/server/internal-api";
import { contractsService } from "../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../src/server/internal-api";

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

export const GET = defineAuthorizedRoute(
  CONTRACT_READ_ROLES,
  async () => contractsService.list()
);

export const POST = defineAuthorizedRoute(
  CONTRACT_WRITE_ROLES,
  async ({ request, user }) => contractsService.create(
    await parseJsonBody(request, createContractSchema),
    user.id
  )
);
