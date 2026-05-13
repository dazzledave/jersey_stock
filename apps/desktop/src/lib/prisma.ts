import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'prisma/dev.db';
const sqlite = new BetterSqlite3(dbPath);
const adapter = new PrismaBetterSqlite3(sqlite);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
