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

    if (!urlSetting?.value || !keySetting?.value) {
      // FALLBACK: Use .env variables if database settings are missing (for fresh machines)
      const envUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!envUrl || !envKey) return null;
      
      return createClient(envUrl.trim(), envKey.trim());
    }

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

  performDownsync: async () => {
    console.log('[SYNC] Starting full downsync from cloud...');
    const supabase = await cloudSyncService.getSupabaseClient();
    if (!supabase) return;

    try {
      // 1. Sync Categories
      const { data: categories } = await supabase.from('categories').select('*');
      if (categories) {
        for (const cat of categories) {
          await prisma.category.upsert({
            where: { id: cat.id },
            update: { name: cat.name },
            create: cat
          });
        }
      }

      // 2. Sync Products
      const { data: products } = await supabase.from('products').select('*');
      if (products) {
        for (const prod of products) {
          await prisma.product.upsert({
            where: { id: prod.id },
            update: { 
              name: prod.name, 
              brand: prod.brand, 
              basePrice: prod.basePrice, 
              costPrice: prod.costPrice,
              imageUrl: prod.imageUrl,
              categoryId: prod.categoryId
            },
            create: prod
          });
        }
      }

      // 3. Sync Variants
      const { data: variants } = await supabase.from('product_variants').select('*');
      if (variants) {
        for (const v of variants) {
          await prisma.productVariant.upsert({
            where: { id: v.id },
            update: { 
              size: v.size, 
              color: v.color, 
              sku: v.sku, 
              barcode: v.barcode 
            },
            create: v
          });
        }
      }

      // 4. Sync Inventory
      const { data: inventory } = await supabase.from('inventory').select('*');
      if (inventory) {
        for (const inv of inventory) {
          await prisma.inventory.upsert({
            where: { variantId: inv.variantId },
            update: { quantity: inv.quantity, reorderLevel: inv.reorderLevel },
            create: inv
          });
        }
      }

      console.log('[SYNC] Downsync complete. All records synchronized.');
    } catch (err: any) {
      console.error('[SYNC] Downsync failed:', err.message);
    }
  },

  startWorker: () => {
    console.log('Starting Cloud Sync Worker...');
    
    // Initial Downsync on startup
    cloudSyncService.performDownsync().catch(err => console.error('Initial downsync error:', err));

    // Periodic tasks
    setInterval(() => {
      cloudSyncService.processSyncQueue().catch(err => console.error('Sync worker error:', err));
    }, 60000); 

    // Periodic Downsync every 10 minutes
    setInterval(() => {
      cloudSyncService.performDownsync().catch(err => console.error('Periodic downsync error:', err));
    }, 600000);
  }
};
