import assert from "node:assert/strict";
import { ImportsService } from "./imports.module.ts";

async function main() {
  {
    const service = new ImportsService({
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
    const service = new ImportsService({} as never);

    const result = await service.validateContractCsv({
      csv: "contractNo,partnerCode,ownerEmail,title,fiscalYear,value,startDate,endDate\nPR-2026-001,VNEXPRESS,staff@prcor.local,Campaign,2026,250000000,2026-05-10,2026-05-01"
    });

    assert.ok(result.issues[0]?.issues.includes("endDate phải lớn hơn startDate."));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
