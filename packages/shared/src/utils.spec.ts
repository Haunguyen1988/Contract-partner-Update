import assert from "node:assert/strict";
import { buildBudgetKey, computeRemainingBudget, daysUntil, normalizeText } from "./utils.ts";

assert.equal(normalizeText("Báo chí Việt Nam"), "bao chi viet nam");
assert.equal(computeRemainingBudget(1000, 250), 750);
assert.equal(buildBudgetKey(2026, "owner-1", null), "2026:owner-1:GENERAL");
assert.equal(daysUntil("2026-03-20T00:00:00.000Z", new Date("2026-03-18T00:00:00.000Z")), 2);
