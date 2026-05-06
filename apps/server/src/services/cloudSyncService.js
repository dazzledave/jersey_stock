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
    'debtorName': 'debtorName',
    'debtorPhone': 'debtorPhone'
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

    const sanitizedUrl = urlSetting.value.trim()
      .replace(/\/rest\/v1\/?$/, '') 
      .replace(/\/+$/, '');
    const sanitizedKey = keySetting.value.trim();

    return createClient(sanitizedUrl, sanitizedKey);
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
            data = await prisma.sale.findUnique({ where: { id: log.entityId } });
            tableName = 'sales';
            break;
          case 'SaleItem':
            data = await prisma.saleItem.findUnique({ where: { id: log.entityId } });
            tableName = 'sale_items';
            break;
          case 'Product':
            data = await prisma.product.findUnique({ where: { id: log.entityId } });
            tableName = 'products';
            break;
          case 'ProductVariant':
            data = await prisma.productVariant.findUnique({ where: { id: log.entityId } });
            tableName = 'product_variants';
            break;
          case 'Category':
            data = await prisma.category.findUnique({ where: { id: log.entityId } });
            tableName = 'categories';
            break;
          case 'Inventory':
            data = await prisma.inventory.findUnique({ where: { variantId: log.entityId } });
            tableName = 'inventory';
            idField = 'variant_id';
            break;
          case 'Customer':
            data = await prisma.customer.findUnique({ where: { id: log.entityId } });
            tableName = 'customers';
            break;
          case 'User':
            data = await prisma.user.findUnique({ where: { id: log.entityId } });
            tableName = 'users';
            break;
        }

        if (!data) {
          await prisma.syncLog.update({ where: { id: log.id }, data: { status: 'SYNCED' } }); 
          continue;
        }

        const cleanData = mapToSnakeCase(data);
        const { error } = await supabase.from(tableName).upsert(cleanData, { onConflict: idField });

        if (error) {
          if (error.code === 'PGRST204') {
            console.warn(`[SYNC WARNING] Missing column on Supabase '${tableName}'. Please update your Supabase schema. Detail: ${error.message}`);
            // Don't mark as synced yet, keep it failed until admin fixes schema
            throw new Error(`Schema Mismatch: Missing column '${error.message.split("'")[1]}' on Supabase table '${tableName}'.`);
          }
          throw error;
        }

        await prisma.syncLog.update({ where: { id: log.id }, data: { status: 'SYNCED', error: null } });
      } catch (error) {
        if (!error.message.includes('Schema Mismatch')) {
          console.error(`Sync failed for ${log.entity} ${log.entityId}:`, error);
        }
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
