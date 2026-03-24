import type { Role } from "@contract/shared";
import {
  defineAuthorizedRoute,
  resolveRouteParams
} from "../../../../../../src/server/internal-api";
import { contractsService } from "../../../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../../../src/server/internal-api";

const CONTRACT_ACTIVATE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER"];

interface RouteContext {
  params: Promise<{
    contractId: string;
  }>;
}

export const POST = defineAuthorizedRoute<RouteContext>(
  CONTRACT_ACTIVATE_ROLES,
  async ({ user, context }) => {
    const { contractId } = await resolveRouteParams(context);
    return contractsService.activate(contractId, user.id);
  }
);
