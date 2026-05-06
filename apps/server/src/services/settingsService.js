const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const settingsService = {
  async getAllSettings() {
    const settings = await prisma.setting.findMany();
    // Convert array of {key, value} to a single object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    return settingsObj;
  },

  async updateSettings(settingsObj) {
    const updates = Object.entries(settingsObj).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });
    await prisma.$transaction(updates);
    return this.getAllSettings();
  }
};

module.exports = settingsService;
