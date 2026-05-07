const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPasswords() {
  try {
    const users = await prisma.user.findMany();
    console.log('User Passwords:', JSON.stringify(users.map(u => ({ username: u.username, hasVisible: !!u.visiblePassword })), null, 2));
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswords();
