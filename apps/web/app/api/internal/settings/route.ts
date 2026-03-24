import type { Role } from "@contract/shared";
import { appSettingsSchema } from "@contract/shared";
import {
  defineAuthorizedRoute,
  parseJsonBody
} from "../../../../src/server/internal-api";
import { settingsService } from "../../../../src/server/services";

export {
  INTERNAL_ROUTE_DYNAMIC as dynamic,
  INTERNAL_ROUTE_RUNTIME as runtime
} from "../../../../src/server/internal-api";

const SETTINGS_READ_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER", "FINANCE"];
const SETTINGS_WRITE_ROLES: Role[] = ["ADMIN", "PR_COR_MANAGER"];

export const GET = defineAuthorizedRoute(
  SETTINGS_READ_ROLES,
  async () => settingsService.getSettings()
);

export const PATCH = defineAuthorizedRoute(
  SETTINGS_WRITE_ROLES,
  async ({ request, user }) => settingsService.updateSettings(
    await parseJsonBody(request, appSettingsSchema),
    user.id
  )
);
