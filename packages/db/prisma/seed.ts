import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { APP_SETTING_KEYS, CONTRACT_EXPIRY_LEAD_DAYS, DEFAULT_BUDGET_POLICY, DEFAULT_CAMPAIGN, normalizeText } from "@contract/shared";

const prisma = new PrismaClient();

async function main() {
  const [adminHash, managerHash, staffHash] = await Promise.all([
    bcrypt.hash("Admin@123", 10),
    bcrypt.hash("Manager@123", 10),
    bcrypt.hash("Staff@123", 10)
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@prcor.local" },
    update: {},
    create: {
      email: "admin@prcor.local",
      fullName: "System Admin",
      role: UserRole.ADMIN,
      passwordHash: adminHash,
      department: "IT"
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@prcor.local" },
    update: {},
    create: {
      email: "manager@prcor.local",
      fullName: "PR COR Manager",
      role: UserRole.PR_COR_MANAGER,
      passwordHash: managerHash,
      department: "PR COR"
    }
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@prcor.local" },
    update: {},
    create: {
      email: "staff@prcor.local",
      fullName: "PR COR Staff",
      role: UserRole.PR_COR_STAFF,
      passwordHash: staffHash,
      department: "PR COR"
    }
  });

  await prisma.appSetting.upsert({
    where: { key: APP_SETTING_KEYS.budgetOverrunPolicy },
    update: { value: DEFAULT_BUDGET_POLICY },
    create: { key: APP_SETTING_KEYS.budgetOverrunPolicy, value: DEFAULT_BUDGET_POLICY }
  });

  await prisma.appSetting.upsert({
    where: { key: APP_SETTING_KEYS.expiryLeadDays },
    update: { value: JSON.stringify(CONTRACT_EXPIRY_LEAD_DAYS) },
    create: { key: APP_SETTING_KEYS.expiryLeadDays, value: JSON.stringify(CONTRACT_EXPIRY_LEAD_DAYS) }
  });

  await prisma.budgetAllocation.upsert({
    where: {
      fiscalYear_ownerId_campaign: {
        fiscalYear: 2026,
        ownerId: staff.id,
        campaign: DEFAULT_CAMPAIGN
      }
    },
    update: {
      allocatedAmount: 800000000,
      committedAmount: 250000000,
      remainingAmount: 550000000
    },
    create: {
      fiscalYear: 2026,
      ownerId: staff.id,
      campaign: DEFAULT_CAMPAIGN,
      allocatedAmount: 800000000,
      committedAmount: 250000000,
      remainingAmount: 550000000
    }
  });

  const partner = await prisma.partner.upsert({
    where: { code: "VNEXPRESS" },
    update: {},
    create: {
      code: "VNEXPRESS",
      legalName: "Công ty Cổ phần Báo chí Việt Nam",
      shortName: "VNExpress Media",
      normalizedName: normalizeText("Công ty Cổ phần Báo chí Việt Nam"),
      taxCode: "0312345678",
      category: "Digital News",
      primaryOwnerId: staff.id,
      backupOwnerId: manager.id,
      contactName: "Nguyen Van A",
      contactEmail: "contact@vnexpress.local",
      contactPhone: "0901234567",
      address: "Ho Chi Minh City"
    }
  });

  await prisma.contract.upsert({
    where: { contractNo: "PR-2026-001" },
    update: {},
    create: {
      contractNo: "PR-2026-001",
      partnerId: partner.id,
      ownerId: staff.id,
      title: "Truyền thông chiến dịch hè 2026",
      fiscalYear: 2026,
      campaign: DEFAULT_CAMPAIGN,
      value: 250000000,
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-05-15T00:00:00.000Z"),
      lifecycleStatus: "ACTIVE",
      activatedAt: new Date("2026-03-05T00:00:00.000Z"),
      notes: "Seed contract for dashboard preview"
    }
  });

  await prisma.auditLog.create({
    data: {
      entityType: "SETTING",
      entityId: APP_SETTING_KEYS.budgetOverrunPolicy,
      action: "SEED_INITIAL_DATA",
      changedById: admin.id,
      diffSummary: { seeded: true }
    }
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
