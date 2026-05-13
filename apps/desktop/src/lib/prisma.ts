import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

// Force load env from the desktop app directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Ensure we have a valid file: URL with an absolute path
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  const absoluteDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  dbUrl = `file:${absoluteDbPath}`;
}

console.log(`[PRISMA] Initializing with URL: ${dbUrl}`);

// Hybrid check for ESM/CJS differences in Prisma 7
const AdapterClass = (typeof PrismaBetterSqlite3 === 'function' && !PrismaBetterSqlite3.prototype)
  ? (PrismaBetterSqlite3 as any)()
  : PrismaBetterSqlite3;

const adapter = new AdapterClass({ url: dbUrl });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
