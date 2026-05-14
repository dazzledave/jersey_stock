import { createClient } from '@supabase/supabase-js';
import { prisma } from '../prisma';

const prepareData = (obj: any) => {
  const sensitiveFields = ['visiblePassword'];
  const newObj: any = {};
  
  Object.keys(obj).forEach(key => {
    if (sensitiveFields.includes(key)) return;
    
    let value = obj[key];
    if (value instanceof Date) {
      value = value.toISOString();
    }
    newObj[key] = value;
  });
  return newObj;
};

export const cloudSyncService = {
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

  saveCredentials: async (url: string, key: string) => {
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

  queueSync: async (entity: string, entityId: string) => {
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
        let data: any;
        let tableName = '';
        let idField = 'id';

        switch (log.entity) {
          case 'Sale':
            data = await prisma.sale.findUnique({ where: { id: log.entityId! } });
            tableName = 'sales';
            break;
          case 'SaleItem':
            data = await prisma.saleItem.findUnique({ where: { id: log.entityId! } });
            tableName = 'sale_items';
            break;
          case 'Product':
            data = await prisma.product.findUnique({ where: { id: log.entityId! } });
            tableName = 'products';
            break;
          case 'ProductVariant':
            data = await prisma.productVariant.findUnique({ where: { id: log.entityId! } });
            tableName = 'product_variants';
            break;
          case 'Category':
            data = await prisma.category.findUnique({ where: { id: log.entityId! } });
            tableName = 'categories';
            break;
          case 'Inventory':
            data = await prisma.inventory.findUnique({ where: { variantId: log.entityId! } });
            tableName = 'inventory';
            idField = 'variantId';
            break;
          case 'Customer':
            data = await prisma.customer.findUnique({ where: { id: log.entityId! } });
            tableName = 'customers';
            break;
          case 'User':
            data = await prisma.user.findUnique({ where: { id: log.entityId! } });
            tableName = 'users';
            break;
        }

        if (!data) {
          await prisma.syncLog.update({ where: { id: log.id }, data: { status: 'SYNCED' } }); 
          continue;
        }

        const cleanData = prepareData(data);
        let conflictField = idField;
        if (tableName === 'users') conflictField = 'username';
        if (tableName === 'categories') conflictField = 'name';
        if (tableName === 'settings') conflictField = 'key';
        
        const { error } = await supabase.from(tableName).upsert(cleanData, { onConflict: conflictField });

        if (error) {
          if (error.code === 'PGRST204') {
            throw new Error(`Schema Mismatch: Missing column '${error.message.split("'")[1]}' on Supabase table '${tableName}'.`);
          }
          throw error;
        }

        await prisma.syncLog.update({ where: { id: log.id }, data: { status: 'SYNCED', error: null } });
      } catch (error: any) {
        if (error.message.includes('violates foreign key constraint')) {
          if (error.message.includes('sales_user_id_fkey') && log.entity === 'Sale') {
            const sale = await prisma.sale.findUnique({ where: { id: log.entityId! } });
            if (sale?.userId) {
               await cloudSyncService.queueSync('User', sale.userId);
            }
          } 
          else if (error.message.includes('sale_items_sale_id_fkey') && log.entity === 'SaleItem') {
            const item = await prisma.saleItem.findUnique({ where: { id: log.entityId! } });
            if (item?.saleId) {
               await cloudSyncService.queueSync('Sale', item.saleId);
            }
          }
        }

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
    }, 60000); 
  }
};
