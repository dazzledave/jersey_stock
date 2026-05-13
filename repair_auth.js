const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3: PBS } = require('@prisma/adapter-better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment
const envPath = path.join(process.cwd(), 'apps', 'desktop', '.env');
dotenv.config({ path: envPath });

async function repairAuth() {
  console.log('🛠 Starting Auth Repair...');

  // Initialize Local Prisma
  const dbPath = path.join(process.cwd(), 'apps', 'desktop', 'prisma', 'dev.db');
  const AdapterClass = (typeof PBS === 'function' && !PBS.prototype) ? PBS() : PBS;
  const adapter = new AdapterClass({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter });

  // Initialize Supabase
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const users = await prisma.user.findMany();
    console.log(`Checking ${users.length} users...`);

    // Get list of existing auth users
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    for (const user of users) {
      const email = `${user.username.toLowerCase()}@jersey-stock.com`;
      const exists = authUsers.find(u => u.email === email);

      if (!exists) {
        console.log(`➕ Creating Cloud Auth for: ${user.username}`);
        const { error: createError } = await supabase.auth.admin.createUser({
          email,
          password: 'password123', // Temporary password
          email_confirm: true,
          user_metadata: { role: user.role, username: user.username }
        });
        
        if (createError) console.error(`   ❌ Failed: ${createError.message}`);
        else console.log(`   ✅ Success! (Default password: password123)`);
      } else {
        console.log(`✨ ${user.username} already synced to Cloud Auth.`);
      }
    }

    console.log('\n✅ Auth Repair Complete!');
    console.log('NOTE: Users created via repair have been assigned a temporary password: password123');
    console.log('They should change their password in the Profile section after logging in.');

  } catch (error) {
    console.error('❌ Repair failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

repairAuth();
