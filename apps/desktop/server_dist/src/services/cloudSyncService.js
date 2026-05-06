const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mapToSnakeCase = (obj) => {
  const mapping = {
    'basePrice': 'base_price',
    'costPrice': 'cost_price',
    'categoryId': 'category_id',
    'imageUrl': 'image_url',
    'productId': 'product_id',
    'reorderLevel': 'reorder_level',
    'variantId': 'variant_id',
    'totalAmount': 'total_amount',
    'paymentMethod': 'payment_method',
    'customerId': 'customer_id',
    'saleId': 'sale_id',
    'userId': 'user_id',
    'debtorName': 'debtor_name',
    'debtorPhone': 'debtor_phone'
  };

  const newObj = {};
  Object.keys(obj).forEach(key => {
    const newKey = mapping[key] || key;
    let value = obj[key];
    if (value instanceof Date) {
      value = value.toISOString();
    }
    newObj[newKey] = value;
  });
  return newObj;
};

const cloudSyncService = {
  getSupabaseClient: async () => {
    const urlSetting = await prisma.setting.findUnique({ where: { key: 'supabaseUrl' } });
    const keySetting = await prisma.setting.findUnique({ where: { key: 'supabaseKey' } });

    if (!urlSetting?.value || !keySetting?.value) return null;

    return createClient(urlSetting.value, keySetting.value);
  },

  saveCredentials: async (url, key) => {
    await prisma.setting.upsert({
      where: { key: 'supabaseUrl' },
      update: { value: url },
      create: { key: 'supabaseUrl', value: url }
    });
    await prisma.setting.upsert({
      where: { key: 'supabaseKey' },
      update: { value: key },
      create: { key: 'supabaseKey', value: key }
    });
  },

  queueSync: async (entity, entityId) => {
    return await prisma.syncLog.create({
      data: {
        entity,
        entityId,
        status: 'PENDING'
      }
    });
  },

  processSyncQueue: async () => {
    const supabase = await cloudSyncService.getSupabaseClient();
    if (!supabase) return;

    const pendingLogs = await prisma.syncLog.findMany({
      where: { status: { in: ['PENDING', 'FAILED'] } },
      take: 20,
      orderBy: { createdAt: 'asc' }
    });

    for (const log of pendingLogs) {
      try {
        let data;
        let tableName;
        let idField = 'id';

        switch (log.entity) {
          case 'Sale':
            data = await prisma.sale.findUnique({ where: { id: log.entityId }, include: { items: true } });
            tableName = 'sales';
            break;
          case 'Product':
            data = await prisma.product.findUnique({ where: { id: log.entityId } });
            tableName = 'products';
            break;
          case 'Category':
            data = await prisma.category.findUnique({ where: { id: log.entityId } });
            tableName = 'categories';
            break;
          case 'User':
            data = await prisma.user.findUnique({ where: { id: log.entityId } });
            tableName = 'users';
            break;
          // Add other entities as needed
        }

        if (!data) {
          await prisma.syncLog.update({ where: { id: log.id }, data: { status: 'SYNCED' } }); // Nothing to sync if deleted locally
          continue;
        }

        const cleanData = mapToSnakeCase(data);
        const { error } = await supabase.from(tableName).upsert(cleanData, { onConflict: idField });

        if (error) throw error;

        await prisma.syncLog.update({ where: { id: log.id }, data: { status: 'SYNCED', error: null } });
      } catch (error) {
        console.error(`Sync failed for ${log.entity} ${log.entityId}:`, error);
        await prisma.syncLog.update({ where: { id: log.id }, data: { status: 'FAILED', error: error.message } });
      }
    }
  },

  startWorker: () => {
    console.log('Starting Cloud Sync Worker...');
    setInterval(() => {
      cloudSyncService.processSyncQueue().catch(err => console.error('Sync worker error:', err));
    }, 60000); // Run every minute
  }
};

module.exports = cloudSyncService;
