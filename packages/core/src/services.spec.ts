import assert from "node:assert/strict";
import {
  BudgetsDomainService,
  ContractsDomainService,
  DocumentsDomainService,
  DomainNotFoundError
} from "./index";
import { ImportsDomainService } from "./imports-domain.service";
import { SettingsDomainService } from "./settings-domain.service";
import type { AuditEntry } from "./types";

async function main() {
  {
    const service = new ImportsDomainService({
      user: {
        findMany: async () => [{ id: "u-1", email: "staff@prcor.local" }]
      }
    } as never);

    const result = await service.validatePartnerCsv({
      csv: "code,legalName,taxCode,category,primaryOwnerEmail\nVNEXPRESS,Cong ty Co phan Bao chi Viet Nam,0312345678,Digital News,"
    });

    assert.equal(result.issues.length, 1);
  }

  {
    const service = new ImportsDomainService({} as never);

    const result = await service.validateContractCsv({
      csv: "contractNo,partnerCode,ownerEmail,title,fiscalYear,value,startDate,endDate\nPR-2026-001,VNEXPRESS,staff@prcor.local,Campaign,2026,250000000,2026-05-10,2026-05-01"
    });

    assert.ok(result.issues[0]?.issues.includes("endDate phải lớn hơn startDate."));
  }

  {
    const service = new BudgetsDomainService({
      budgetAllocation: {
        findMany: async () => [
          {
            id: "budget-1",
            fiscalYear: 2026,
            ownerId: "owner-1",
            campaign: "GENERAL",
            allocatedAmount: 1000,
            committedAmount: 250,
            remainingAmount: 750,
            owner: {
              id: "owner-1",
              fullName: "Owner One",
              email: "owner-1@local",
              role: "PR_COR_MANAGER"
            }
          }
        ]
      }
    } as never, {
      log: async () => ({})
    });

    const budgetRows = await service.list();

    assert.equal(budgetRows[0]?.ownerName, "Owner One");
    assert.equal(budgetRows[0]?.remainingAmount, "750");
  }

  {
    const service = new ContractsDomainService({
      contract: {
        findUnique: async () => null
      }
    } as never, {
      recomputeBudget: async () => null,
      evaluateBudget: async () => ({
        hasBudget: true,
        remainingAmount: "1000",
        projectedRemainingAmount: "750",
        isOverBudget: false
      })
    }, {
      getSettings: async () => ({
        budgetOverrunPolicy: "WARN",
        expiryLeadDays: [30, 15, 7, 1]
      })
    }, {
      log: async () => ({})
    });

    await assert.rejects(
      () => service.findOne("missing-contract"),
      (error: unknown) => error instanceof DomainNotFoundError
    );
  }

  {
    const service = new DocumentsDomainService({
      contract: {
        findUnique: async () => null
      }
    } as never, {
      store: async () => ({
        filename: "stored-file.pdf",
        storageKey: "contract-1/stored-file.pdf"
      })
    }, {
      log: async () => ({})
    });

    await assert.rejects(
      () => service.listByContract("missing-contract"),
      (error: unknown) => error instanceof DomainNotFoundError
    );
  }

  {
    const auditEntries: Array<Record<string, unknown>> = [];
    const service = new SettingsDomainService({
      appSetting: {
        findMany: async () => []
      },
      $transaction: async () => []
    } as never, {
      log: async (entry: AuditEntry) => {
        auditEntries.push(entry.diffSummary ?? {});
        return {};
      }
    });

    const result = await service.getSettings();

    assert.equal(result.budgetOverrunPolicy, "WARN");
    assert.deepEqual(result.expiryLeadDays, [30, 15, 7, 1]);
    assert.equal(auditEntries.length, 0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
