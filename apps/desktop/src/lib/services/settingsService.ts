import { prisma } from '../prisma';

export const settingsService = {
  async getAllSettings() {
    const settings = await prisma.setting.findMany();
    const settingsObj: any = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    return settingsObj;
  },

  async updateSettings(settingsObj: any) {
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
