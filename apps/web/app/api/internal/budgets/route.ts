import type { Role } from "@contract/shared";
import { createBudgetAllocationSchema } from "@contract/shared";
import {
  defineAuthorizedRoute,
  parseJsonBody
} from "../../../../src/server/internal-api";
import { budgetsService } from "../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../src/server/internal-api";

const BUDGET_READ_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "FINANCE", "LEADERSHIP"];
const BUDGET_WRITE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "FINANCE"];

export const GET = defineAuthorizedRoute(
  BUDGET_READ_ROLES,
  async () => budgetsService.list()
);

export const POST = defineAuthorizedRoute(
  BUDGET_WRITE_ROLES,
  async ({ request, user }) => budgetsService.upsert(
    await parseJsonBody(request, createBudgetAllocationSchema),
    user.id
  )
);
