const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(process.cwd(), 'apps', 'desktop', '.env');
dotenv.config({ path: envPath });

async function totalWipe() {
  console.log('🚀 Starting Total System Wipe...');

  // 1. Initialize Local Prisma
  const dbPath = path.join(process.cwd(), 'apps', 'desktop', 'prisma', 'dev.db');
  
  // Logic to handle PrismaBetterSqlite3 as class or factory
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const AdapterClass = (typeof PrismaBetterSqlite3 === 'function' && !PrismaBetterSqlite3.prototype)
    ? PrismaBetterSqlite3()
    : PrismaBetterSqlite3;

  const adapter = new AdapterClass({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter });

  // 2. Initialize Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file!');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // --- SUPABASE WIPE ---
    console.log('☁️ Clearing Supabase Auth...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing Supabase users:', listError.message);
    } else {
      for (const user of users) {
        await supabase.auth.admin.deleteUser(user.id);
        console.log(`   Deleted Auth: ${user.email}`);
      }
    }

    console.log('☁️ Clearing Supabase "users" table...');
    const { error: dbError } = await supabase.from('users').delete().neq('id', '0');
    if (dbError) console.warn('   Note: Failed to clear Supabase users table (maybe it was already empty?)');

    // --- LOCAL WIPE ---
    console.log('💻 Clearing Local Database...');
    
    // Delete in order to avoid foreign key issues
    await prisma.syncLog.deleteMany({});
    console.log('   Cleared Sync Logs');

    await prisma.user.deleteMany({});
    console.log('   Cleared Users');

    // Reset settings so setup wizard triggers
    await prisma.setting.deleteMany({
      where: { key: { in: ['lastSync', 'supabase_url', 'supabase_key'] } }
    });
    console.log('   Reset System Settings');

    console.log('\n✅ WIPE COMPLETE! Your system is now back to a factory state.');
    console.log('Please restart the app to begin the new setup.');

  } catch (error) {
    console.error('❌ Wipe failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

totalWipe();
