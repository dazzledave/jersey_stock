const { PrismaClient } = require('@prisma/client');
const { getSupabaseAdmin } = require('../src/utils/supabaseClient');
require('dotenv').config();

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration to Supabase Auth...');
  
  const supabase = await getSupabaseAdmin();
  if (!supabase) {
    console.error('Error: Supabase Admin client could not be initialized. Check your .env file.');
    process.exit(1);
  }

  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in local database.`);

  for (const user of users) {
    const email = `${user.username.toLowerCase()}@jersey-stock.com`;
    console.log(`Checking user: ${user.username} (${email})...`);

    try {
      // If we don't have a visible password, we can't migrate them (they'd need to reset)
      if (!user.visiblePassword) {
        console.warn(`User ${user.username} has no visible password. Skipping creation (needs manual reset).`);
        continue;
      }

      // Create user in Supabase Auth
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email,
        password: user.visiblePassword,
        email_confirm: true,
        user_metadata: { role: user.role, username: user.username }
      });

      if (error) {
        if (error.message.includes('already registered') || error.status === 422) {
          console.log(`User ${user.username} is already in Supabase Auth. Skipping.`);
        } else {
          console.error(`Failed to create ${user.username} in Supabase: ${error.message}`);
        }
      } else {
        console.log(`Successfully migrated ${user.username} to Supabase Auth.`);
      }
    } catch (err) {
      console.error(`Unexpected error migrating ${user.username}:`, err.message);
    }
  }

  console.log('Migration complete.');
  await prisma.$disconnect();
}

migrate();
