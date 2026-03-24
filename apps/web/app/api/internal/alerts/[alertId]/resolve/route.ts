import type { Role } from "@contract/shared";
import { alertResolutionSchema } from "@contract/shared";
import {
  defineAuthorizedRoute,
  parseJsonBody,
  resolveRouteParams
} from "../../../../../../src/server/internal-api";
import { alertsService } from "../../../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../../../src/server/internal-api";

const ALERT_RESOLVE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "PR_COR_STAFF", "FINANCE"];

interface RouteContext {
  params: Promise<{
    alertId: string;
  }>;
}

export const PATCH = defineAuthorizedRoute<RouteContext>(
  ALERT_RESOLVE_ROLES,
  async ({ request, user, context }) => {
    const payload = await parseJsonBody(request, alertResolutionSchema);
    const { alertId } = await resolveRouteParams(context);
    return alertsService.resolve(alertId, payload, user.id);
  }
);
