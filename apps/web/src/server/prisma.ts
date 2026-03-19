import { PrismaClient } from "@contract/db";

const globalForPrisma = globalThis as typeof globalThis & {
  contractWebPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.contractWebPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.contractWebPrisma = prisma;
}
