import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { APP_SETTING_KEYS, CONTRACT_EXPIRY_LEAD_DAYS, DEFAULT_BUDGET_POLICY, DEFAULT_CAMPAIGN, normalizeText } from "@contract/shared";

const prisma = new PrismaClient();

// ─── Vietnamese Name & Company Data ───────────────────────────────────────────

const LAST_NAMES = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Phan", "Vu", "Vo", "Dang", "Bui", "Do", "Ho", "Ngo", "Duong", "Ly"];
const MIDDLE_NAMES = ["Van", "Thi", "Minh", "Duc", "Quoc", "Thanh", "Ngoc", "Hoang", "Xuan", "Tuan", "Anh", "Huu", "Dinh", "Bao"];
const FIRST_NAMES = ["An", "Binh", "Chi", "Dung", "Em", "Giang", "Hoa", "Khoa", "Linh", "Mai", "Nam", "Oanh", "Phuc", "Quang", "Son", "Trang", "Uy", "Vy", "Yen", "Hien", "Dat", "Khanh", "Long", "Nhi", "Phuong", "Hai", "Tam", "Thao", "Tien", "Trung"];

const COMPANY_PREFIXES = [
  "Công ty TNHH", "Công ty Cổ phần", "Công ty TNHH MTV", "Tập đoàn", "Công ty TNHH TM-DV",
  "Công ty CP Truyền thông", "Công ty TNHH Quảng cáo", "Đài", "Báo", "Tạp chí"
];

const COMPANY_CORES = [
  "Truyền thông Sài Gòn", "Media Group Việt Nam", "Quảng cáo Đông Á", "Báo chí Thủ Đô",
  "Truyền hình Phương Nam", "Digital Marketing Pro", "Sáng tạo Nội dung ABC", "Quảng bá Thương hiệu",
  "PR Solutions", "Content Factory", "Truyền thông Đại Việt", "Media Link", "Creative Hub",
  "Tin tức Sài Gòn", "Truyền thông Năm Sao", "Quảng cáo Việt", "Digital First", "Báo chí Online",
  "Truyền thông Hoàng Gia", "Media Connect", "Quảng cáo Toàn Cầu", "Nội dung Số", "PR Master",
  "Tin Nhanh 24h", "Truyền thông Hải Phòng", "Báo chí Miền Trung", "Media One", "Quảng bá Sáng Tạo",
  "Digital Wave", "Truyền thông Xanh", "Smart Media", "Báo chí Cộng đồng", "Content Pro",
  "Truyền thông Phú Quốc", "Media Star", "Quảng cáo Thông Minh", "Digital Connect", "PR Online",
  "Truyền thông Bắc Sơn", "Media Plus", "Quảng cáo Đỉnh Cao", "Nội dung Việt", "Creative Media",
  "Truyền thông Cần Thơ", "Digital Hub", "Báo chí Thể Thao", "Media World", "Quảng cáo An Phú",
  "Truyền thông Đà Nẵng", "Content Hub", "PR Capital", "Tin tức Thương mại", "Media Trend",
  "Quảng cáo Tân Tiến", "Digital Vision", "Truyền thông Mekong", "Báo chí Kinh tế", "Media Lab",
  "Quảng cáo Thành Đạt", "Creative Content", "Truyền thông Hà Nội", "Digital Art", "PR Agency VN",
  "Truyền thông Tây Nguyên", "Media Network", "Quảng cáo Hiện Đại", "Nội dung Sáng tạo", "Smart Ads",
  "Truyền thông Biển Đông", "Digital Edge", "Báo chí Pháp luật", "Media Max", "Quảng cáo Phú Thịnh",
  "Truyền thông Nghệ An", "Content Studio", "PR Excellence", "Tin tức Công nghệ", "Media Focus",
  "Quảng cáo Hưng Thịnh", "Digital Stream", "Truyền thông Long An", "Báo chí Giáo dục", "Media Core",
  "Quảng cáo Đại Nam", "Creative Studio VN", "Truyền thông Khánh Hòa", "Digital Smart", "PR Vision",
  "Truyền thông Bình Dương", "Media Bridge", "Quảng cáo Tầm Nhìn", "Nội dung Thời đại", "Smart Content",
  "Truyền thông Lâm Đồng", "Digital Pro VN", "Báo chí Văn hóa", "Media Expert", "Quảng cáo Phát Đạt"
];

const CATEGORIES = ["NEWSPAPER", "TV_STATION", "DIGITAL_MEDIA", "AGENCY", "FREELANCER", "MAGAZINE", "RADIO", "OUTDOOR_ADS", "EVENT_COMPANY", "PRODUCTION_HOUSE"];

const CITIES = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế", "Nha Trang", "Bình Dương", "Đồng Nai", "Quảng Ninh", "Nghệ An", "Thanh Hóa", "Vũng Tàu", "Long An", "Lâm Đồng"];

const CAMPAIGNS = ["GENERAL", "SUMMER_2026", "TET_2026", "BRAND_LAUNCH", "CSR_2026", "PRODUCT_PR", "EVENT_COVERAGE", "CRISIS_MGMT"];

const CONTRACT_TITLES = [
  "Truyền thông chiến dịch", "Quảng cáo báo in", "Bài PR đa nền tảng", "Sản xuất video TVC",
  "Tài trợ chuyên mục", "Phỏng vấn đặc biệt", "Quảng cáo digital", "Event coverage",
  "Bài viết chuyên đề", "Social media marketing", "Banner quảng cáo", "Phóng sự doanh nghiệp",
  "Livestream sự kiện", "Content marketing Q2", "Quảng bá thương hiệu", "PR khủng hoảng",
  "Chiến dịch CSR", "Kế hoạch truyền thông năm", "Gói quảng cáo tổng hợp", "Sản xuất nội dung số"
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function padNum(n: number, len: number) { return String(n).padStart(len, "0"); }

function genTaxCode(index: number): string {
  return `0${padNum(300000000 + index * 1117, 9)}`;
}

function genViName(): string {
  return `${pick(LAST_NAMES)} ${pick(MIDDLE_NAMES)} ${pick(FIRST_NAMES)}`;
}

function genPhone(): string {
  const prefixes = ["090", "091", "093", "097", "098", "070", "079", "077", "076"];
  return `${pick(prefixes)}${padNum(randInt(1000000, 9999999), 7)}`;
}

function futureDate(baseDays: number, spreadDays: number): Date {
  const d = new Date("2026-03-01T00:00:00.000Z");
  d.setDate(d.getDate() + baseDays + randInt(0, spreadDays));
  return d;
}

function pastDate(daysAgo: number, spreadDays: number): Date {
  const d = new Date("2026-03-19T00:00:00.000Z");
  d.setDate(d.getDate() - daysAgo - randInt(0, spreadDays));
  return d;
}

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database with sample data...\n");

  // ── 1. Users (keep existing 3 + add 5 more) ──────────────────────────────
  console.log("👤 Creating users...");
  const passwordHash = await bcrypt.hash("Password@123", 10);
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const managerHash = await bcrypt.hash("Manager@123", 10);
  const staffHash = await bcrypt.hash("Staff@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@prcor.local" },
    update: {},
    create: { email: "admin@prcor.local", fullName: "System Admin", role: UserRole.ADMIN, passwordHash: adminHash, department: "IT" }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@prcor.local" },
    update: {},
    create: { email: "manager@prcor.local", fullName: "Trần Thị Mai", role: UserRole.PR_COR_MANAGER, passwordHash: managerHash, department: "PR COR" }
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@prcor.local" },
    update: {},
    create: { email: "staff@prcor.local", fullName: "Nguyễn Văn Bình", role: UserRole.PR_COR_STAFF, passwordHash: staffHash, department: "PR COR" }
  });

  const extraUsers = [
    { email: "finance@prcor.local", fullName: "Lê Hoàng Phúc", role: UserRole.FINANCE, department: "Finance" },
    { email: "legal@prcor.local", fullName: "Phạm Ngọc Linh", role: UserRole.LEGAL, department: "Legal" },
    { email: "procurement@prcor.local", fullName: "Hoàng Minh Đức", role: UserRole.PROCUREMENT, department: "Procurement" },
    { email: "staff2@prcor.local", fullName: "Vũ Thị Hoa", role: UserRole.PR_COR_STAFF, department: "PR COR" },
    { email: "leader@prcor.local", fullName: "Đặng Quốc An", role: UserRole.LEADERSHIP, department: "BOD" },
  ];

  const allUsers = [admin, manager, staff];
  for (const u of extraUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash }
    });
    allUsers.push(user);
  }
  console.log(`   ✅ ${allUsers.length} users ready\n`);

  // Owner pool (staff roles that can own partners/contracts)
  const ownerPool = allUsers.filter(u => ["PR_COR_STAFF", "PR_COR_MANAGER"].includes(u.role));

  // ── 2. App Settings ───────────────────────────────────────────────────────
  console.log("⚙️  Creating app settings...");
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
  console.log("   ✅ Settings ready\n");

  // ── 3. Partners (~100) ────────────────────────────────────────────────────
  console.log("🏢 Creating ~100 partners...");
  const partners: { id: string; code: string }[] = [];

  for (let i = 0; i < 100; i++) {
    const prefix = pick(COMPANY_PREFIXES);
    const core = COMPANY_CORES[i % COMPANY_CORES.length];
    const legalName = `${prefix} ${core}`;
    const code = `P-${padNum(i + 1, 3)}`;
    const primaryOwner = pick(ownerPool);
    const backupOwner = pick(ownerPool.filter(o => o.id !== primaryOwner.id));

    try {
      const partner = await prisma.partner.upsert({
        where: { code },
        update: {},
        create: {
          code,
          legalName,
          shortName: core.length > 30 ? core.substring(0, 30) : core,
          normalizedName: normalizeText(legalName),
          taxCode: genTaxCode(i),
          category: pick(CATEGORIES),
          primaryOwnerId: primaryOwner.id,
          backupOwnerId: backupOwner.id,
          contactName: genViName(),
          contactEmail: `contact${i + 1}@partner.local`,
          contactPhone: genPhone(),
          address: pick(CITIES),
          status: i < 90 ? "ACTIVE" : "INACTIVE"
        }
      });
      partners.push({ id: partner.id, code: partner.code });
    } catch {
      // skip duplicates on re-run
    }
  }
  console.log(`   ✅ ${partners.length} partners created\n`);

  // ── 4. Budget Allocations (~30) ───────────────────────────────────────────
  console.log("💰 Creating ~30 budget allocations...");
  let budgetCount = 0;
  for (const owner of ownerPool) {
    for (const campaign of CAMPAIGNS.slice(0, randInt(3, 6))) {
      const allocated = randInt(200, 2000) * 1_000_000; // 200M - 2B VND
      const committed = Math.floor(allocated * (randInt(10, 80) / 100));
      try {
        await prisma.budgetAllocation.upsert({
          where: { fiscalYear_ownerId_campaign: { fiscalYear: 2026, ownerId: owner.id, campaign } },
          update: { allocatedAmount: allocated, committedAmount: committed, remainingAmount: allocated - committed },
          create: {
            fiscalYear: 2026,
            ownerId: owner.id,
            campaign,
            allocatedAmount: allocated,
            committedAmount: committed,
            remainingAmount: allocated - committed
          }
        });
        budgetCount++;
      } catch {
        // skip duplicates
      }
    }
  }
  console.log(`   ✅ ${budgetCount} budget allocations created\n`);

  // ── 5. Contracts (~200) ───────────────────────────────────────────────────
  console.log("📄 Creating ~200 contracts...");
  const statuses: Array<"DRAFT" | "ACTIVE" | "EXPIRED" | "PENDING_ACTIVATION"> = ["DRAFT", "ACTIVE", "ACTIVE", "ACTIVE", "EXPIRED", "PENDING_ACTIVATION"];
  let contractCount = 0;

  for (let i = 0; i < 200; i++) {
    const partner = pick(partners);
    const owner = pick(ownerPool);
    const status = pick(statuses);
    const campaign = pick(CAMPAIGNS);
    const value = randInt(20, 800) * 1_000_000;
    const contractNo = `PR-2026-${padNum(i + 1, 4)}`;
    const title = `${pick(CONTRACT_TITLES)} - ${partner.code}`;

    const startDate = status === "EXPIRED" ? pastDate(180, 90) : pastDate(60, 30);
    const endDate = status === "EXPIRED"
      ? pastDate(5, 30)
      : futureDate(30, 120);

    try {
      await prisma.contract.upsert({
        where: { contractNo },
        update: {},
        create: {
          contractNo,
          partnerId: partner.id,
          ownerId: owner.id,
          title,
          fiscalYear: 2026,
          campaign,
          value,
          startDate,
          endDate,
          lifecycleStatus: status,
          activatedAt: status === "ACTIVE" ? pastDate(30, 20) : undefined,
          notes: i < 10 ? "Hợp đồng ưu tiên cao" : undefined
        }
      });
      contractCount++;
    } catch {
      // skip duplicates on re-run
    }
  }
  console.log(`   ✅ ${contractCount} contracts created\n`);

  // ── 6. Alerts (auto-generate for expiring contracts) ──────────────────────
  console.log("🔔 Creating alerts for expiring contracts...");
  const expiringContracts = await prisma.contract.findMany({
    where: {
      lifecycleStatus: "ACTIVE",
      endDate: { lte: futureDate(30, 0) }
    },
    include: { partner: true }
  });

  let alertCount = 0;
  for (const c of expiringContracts.slice(0, 20)) {
    const fingerprint = `EXP-${c.contractNo}`;
    try {
      await prisma.alert.upsert({
        where: { fingerprint },
        update: {},
        create: {
          fingerprint,
          type: "CONTRACT_EXPIRY",
          severity: "WARNING",
          status: "OPEN",
          entityType: "CONTRACT",
          entityId: c.id,
          contractId: c.id,
          title: `Hợp đồng ${c.contractNo} sắp hết hạn`,
          message: `Hợp đồng "${c.title}" với ${c.partner.legalName} sẽ hết hạn vào ${c.endDate.toISOString().slice(0, 10)}.`,
          dueDate: c.endDate,
          assignedRole: "PR_COR_STAFF"
        }
      });
      alertCount++;
    } catch { /* skip */ }
  }
  console.log(`   ✅ ${alertCount} alerts created\n`);

  // ── 7. Audit Log ──────────────────────────────────────────────────────────
  console.log("📝 Creating audit log entry...");
  await prisma.auditLog.create({
    data: {
      entityType: "SETTING",
      entityId: APP_SETTING_KEYS.budgetOverrunPolicy,
      action: "SEED_SAMPLE_DATA",
      changedById: admin.id,
      diffSummary: { seeded: true, partners: partners.length, contracts: contractCount, budgets: budgetCount }
    }
  });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 SEED HOÀN TẤT!");
  console.log(`   👤 Users:     ${allUsers.length}`);
  console.log(`   🏢 Partners:  ${partners.length}`);
  console.log(`   💰 Budgets:   ${budgetCount}`);
  console.log(`   📄 Contracts: ${contractCount}`);
  console.log(`   🔔 Alerts:    ${alertCount}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
