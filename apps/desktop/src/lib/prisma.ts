import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
// @ts-ignore
import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Force load env from the desktop app directory
if (process.env.NODE_ENV !== 'production' && !(process as any).packaged) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Determine database path - UNIFIED LOGIC
function getDbPath() {
  let dbPath = process.env.DATABASE_PATH;
  if (!dbPath) {
    const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
    const folderName = 'awards-centre-pos';
    dbPath = path.join(appData, folderName, 'jersey_stock.db');
  }
  return dbPath;
}

let prismaInstance: PrismaClient | null = null;

// LAZY PROXY CONSTRUCTOR: Prevents loading better-sqlite3 binary at build/compile time,
// avoiding Node.js vs Electron ABI version mismatches (e.g. error NODE_MODULE_VERSION 123 vs 127).
const prismaProxy = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    if (!prismaInstance) {
      if (globalForPrisma.prisma) {
        prismaInstance = globalForPrisma.prisma;
      } else {
        const dbPath = getDbPath();
        
        // Final safety check
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
        
        console.log(`[PRISMA] Lazily opening database at: ${dbPath}`);
        
        const db = new Database(dbPath);
        const adapter = new PrismaBetterSqlite3(db);
        
        prismaInstance = new PrismaClient({
          adapter,
          log: ['error', 'warn'],
        });
        
        if (process.env.NODE_ENV !== 'production') {
          globalForPrisma.prisma = prismaInstance;
        }
      }
    }
    
    const value = Reflect.get(prismaInstance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(prismaInstance);
    }
    return value;
  }
});

export const prisma = prismaProxy;
