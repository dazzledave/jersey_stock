const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in DB:', JSON.stringify(users.map(u => ({ id: u.id, username: u.username, role: u.role })), null, 2));
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
