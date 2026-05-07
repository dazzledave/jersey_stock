const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.setting.findMany();
    console.log('Settings in DB:', JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('Error fetching settings:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
