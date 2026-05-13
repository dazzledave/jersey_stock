const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3: PBS } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(process.cwd(), 'apps', 'desktop', '.env');
dotenv.config({ path: envPath });

async function fullReset() {
  console.log('☢️ WARNING: Starting FULL FACTORY RESET...');

  // Initialize Local Prisma
  const dbPath = path.join(process.cwd(), 'apps', 'desktop', 'prisma', 'dev.db');
  const AdapterClass = (typeof PBS === 'function' && !PBS.prototype) ? PBS() : PBS;
  const adapter = new AdapterClass({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🧹 Wiping all tables...');

    // Delete in reverse order of dependencies
    await prisma.syncLog.deleteMany({});
    console.log('   - Sync Logs cleared');

    await prisma.saleItem.deleteMany({});
    console.log('   - Sale Items cleared');

    await prisma.sale.deleteMany({});
    console.log('   - Sales cleared');

    await prisma.stockMovement.deleteMany({});
    console.log('   - Stock Movements cleared');

    await prisma.inventory.deleteMany({});
    console.log('   - Inventory cleared');

    await prisma.productVariant.deleteMany({});
    console.log('   - Product Variants cleared');

    await prisma.product.deleteMany({});
    console.log('   - Products cleared');

    await prisma.category.deleteMany({});
    console.log('   - Categories cleared');

    await prisma.customer.deleteMany({});
    console.log('   - Customers cleared');

    await prisma.user.deleteMany({});
    console.log('   - Users cleared');

    // Keep basic settings but clear lastSync
    await prisma.setting.deleteMany({
      where: { key: 'lastSync' }
    });
    console.log('   - Sync state reset');

    console.log('\n✨ FACTORY RESET COMPLETE! The inventory should now be empty.');

  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fullReset();
