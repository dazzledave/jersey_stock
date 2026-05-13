const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const BetterSqlite3 = require('better-sqlite3');
const path = require('path');

async function checkSyncLogs() {
  const dbPath = path.join(process.cwd(), 'apps', 'desktop', 'prisma', 'dev.db');
  
  // Hybrid check for the diagnostic script
  const AdapterClass = (typeof PrismaBetterSqlite3 === 'function' && !PrismaBetterSqlite3.prototype)
    ? PrismaBetterSqlite3()
    : PrismaBetterSqlite3;

  const adapter = new AdapterClass({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- LATEST SYNC LOGS ---');
    const logs = await prisma.syncLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    if (logs.length === 0) {
      console.log('No sync logs found.');
    } else {
      logs.forEach(log => {
        console.log(`[${log.createdAt.toISOString()}] ${log.entity} (${log.entityId}): ${log.status}`);
        if (log.error) console.log(`   Error: ${log.error}`);
      });
    }

    const pendingCount = await prisma.syncLog.count({
      where: { status: 'PENDING' }
    });
    console.log(`\nTotal PENDING syncs: ${pendingCount}`);

    const settings = await prisma.setting.findMany();
    console.log('\n--- SYNC SETTINGS ---');
    settings.forEach(s => {
      const val = s.key.toLowerCase().includes('key') ? '********' : s.value;
      console.log(`${s.key}: ${val}`);
    });

  } catch (error) {
    console.error('Diagnostic failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSyncLogs();
