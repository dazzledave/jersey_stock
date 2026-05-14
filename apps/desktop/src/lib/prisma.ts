import { PrismaClient } from '../generated/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Force load env from the desktop app directory
if (process.env.NODE_ENV !== 'production' && !(process as any).packaged) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Determine database path - UNIFIED LOGIC
let dbPath = process.env.DATABASE_PATH;

if (!dbPath) {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
  const folderName = 'awards-centre-pos';
  dbPath = path.join(appData, folderName, 'jersey_stock.db');
}

// Final safety check
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`[PRISMA] Opening database at: ${dbPath}`);

const AdapterClass = (typeof PrismaBetterSqlite3 === 'function' && !PrismaBetterSqlite3.prototype)
  ? (PrismaBetterSqlite3 as any)()
  : PrismaBetterSqlite3;

const adapter = new AdapterClass({ url: dbPath });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
