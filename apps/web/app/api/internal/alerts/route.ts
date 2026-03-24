import type { Role } from "@contract/shared";
import { defineAuthorizedRoute } from "../../../../src/server/internal-api";
import { alertsService } from "../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../src/server/internal-api";

const ALERT_READ_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE", "LEGAL", "PROCUREMENT", "LEADERSHIP"];

export const GET = defineAuthorizedRoute(
  ALERT_READ_ROLES,
  async ({ user }) => alertsService.list(user)
);
