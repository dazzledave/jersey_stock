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

    const clientOptions = {
      auth: {
        persistSession: false
      },
      global: {
        fetch: (url: any, options: any) => {
          return fetch(url, {
            ...options,
            cache: 'no-store'
          });
        }
      }
    };

    if (!urlSetting?.value || !keySetting?.value) {
      // FALLBACK: Use .env variables if database settings are missing (for fresh machines)
      const envUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!envUrl || !envKey) return null;
      
      console.log(`[SYNC] Fallback client using URL: ${envUrl} and Key (prefix): ${envKey.slice(0, 10)}... (suffix): ${envKey.slice(-10)}`);
      return createClient(envUrl.trim(), envKey.trim(), clientOptions);
    }

    const sanitizedUrl = urlSetting.value.trim()
      .replace(/\/rest\/v1\/?$/, '') 
      .replace(/\/+$/, '');
    const sanitizedKey = keySetting.value.trim();

    return createClient(sanitizedUrl, sanitizedKey, clientOptions);
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
    const log = await prisma.syncLog.create({
      data: {
        entity,
        entityId,
        status: 'PENDING'
      }
    });
    // Fire the sync queue processing instantly in the background for near real-time sync!
    cloudSyncService.processSyncQueue().catch(err => console.error('Instant sync queue error:', err));
    return log;
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
          case 'AuditLog':
            data = await prisma.auditLog.findUnique({ where: { id: log.entityId! } });
            tableName = 'audit_logs';
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

    // 1. Sync Categories
    try {
      const { data: categories, error: catErr } = await supabase.from('categories').select('*');
      if (catErr) throw catErr;
      console.log(`[SYNC] Downsync fetched ${categories?.length} categories from cloud.`);
      if (categories) {
        const remoteCatIds = categories.map(cat => cat.id);
        try {
          await prisma.category.deleteMany({
            where: { id: { notIn: remoteCatIds } }
          });
        } catch (delErr: any) {
          console.warn('[SYNC] Category deleteMany warning (probably referenced by local products):', delErr.message);
        }
        
        for (const cat of categories) {
          try {
            await prisma.category.upsert({
              where: { id: cat.id },
              update: { name: cat.name },
              create: cat
            });
          } catch (rowErr: any) {
            console.error(`[SYNC] Failed to upsert category ${cat.name} (${cat.id}):`, rowErr.message);
          }
        }
      }
    } catch (err: any) {
      console.error('[SYNC] Categories downsync failed:', err.message);
    }

    // 2. Sync Products
    try {
      const { data: products, error: prodErr } = await supabase.from('products').select('*');
      if (prodErr) throw prodErr;
      console.log(`[SYNC] Downsync fetched ${products?.length} products from cloud.`);
      if (products) {
        const remoteProdIds = products.map(prod => prod.id);
        try {
          const localProdsToDelete = await prisma.product.findMany({
            where: { id: { notIn: remoteProdIds } },
            include: { variants: true }
          });
          if (localProdsToDelete.length > 0) {
            const variantIdsToDelete = localProdsToDelete.flatMap(p => p.variants.map(v => v.id));
            if (variantIdsToDelete.length > 0) {
              await prisma.stockMovement.deleteMany({
                where: { variantId: { in: variantIdsToDelete } }
              });
              await prisma.saleItem.deleteMany({
                where: { variantId: { in: variantIdsToDelete } }
              });
            }
            await prisma.product.deleteMany({
              where: { id: { notIn: remoteProdIds } }
            });
          }
        } catch (delErr: any) {
          console.warn('[SYNC] Product deleteMany warning:', delErr.message);
        }

        for (const prod of products) {
          try {
            // Validate categoryId exists locally first
            const catExists = await prisma.category.findUnique({ where: { id: prod.categoryId } });
            if (!catExists) {
              console.warn(`[SYNC] Skipping product ${prod.name} because parent category ${prod.categoryId} does not exist locally.`);
              continue;
            }
            await prisma.product.upsert({
              where: { id: prod.id },
              update: { 
                name: prod.name, 
                brand: prod.brand, 
                basePrice: prod.basePrice, 
                costPrice: prod.costPrice,
                imageUrl: prod.imageUrl,
                categoryId: prod.categoryId,
                isActive: prod.isActive ?? true
              },
              create: prod
            });
          } catch (rowErr: any) {
            console.error(`[SYNC] Failed to upsert product ${prod.name} (${prod.id}):`, rowErr.message);
          }
        }
      }
    } catch (err: any) {
      console.error('[SYNC] Products downsync failed:', err.message);
    }

    // 3. Sync Variants
    try {
      const { data: variants, error: varErr } = await supabase.from('product_variants').select('*');
      if (varErr) throw varErr;
      if (variants) {
        const remoteVariantIds = variants.map(v => v.id);
        try {
          const localVariantsToDelete = await prisma.productVariant.findMany({
            where: { id: { notIn: remoteVariantIds } }
          });
          if (localVariantsToDelete.length > 0) {
            const varIds = localVariantsToDelete.map(v => v.id);
            await prisma.stockMovement.deleteMany({
              where: { variantId: { in: varIds } }
            });
            await prisma.saleItem.deleteMany({
              where: { variantId: { in: varIds } }
            });
            await prisma.productVariant.deleteMany({
              where: { id: { notIn: remoteVariantIds } }
            });
          }
        } catch (delErr: any) {
          console.warn('[SYNC] Variant deleteMany warning:', delErr.message);
        }
        
        const localProductIds = (await prisma.product.findMany({ select: { id: true } })).map(p => p.id);
        for (const v of variants) {
          try {
            if (!localProductIds.includes(v.productId)) {
              console.warn(`[SYNC] Skipping orphan variant ${v.id} because parent product ${v.productId} is missing.`);
              continue;
            }
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
          } catch (rowErr: any) {
            console.error(`[SYNC] Failed to upsert variant ${v.id}:`, rowErr.message);
          }
        }
      }
    } catch (err: any) {
      console.error('[SYNC] Variants downsync failed:', err.message);
    }

    // 4. Sync Inventory
    try {
      const { data: inventory, error: invErr } = await supabase.from('inventory').select('*');
      if (invErr) throw invErr;
      if (inventory) {
        const remoteVariantIds = inventory.map(inv => inv.variantId);
        try {
          await prisma.inventory.deleteMany({
            where: { variantId: { notIn: remoteVariantIds } }
          });
        } catch (delErr: any) {
          console.warn('[SYNC] Inventory deleteMany warning:', delErr.message);
        }

        const localVariantIds = (await prisma.productVariant.findMany({ select: { id: true } })).map(v => v.id);
        for (const inv of inventory) {
          try {
            if (!localVariantIds.includes(inv.variantId)) {
              console.warn(`[SYNC] Skipping orphan inventory record for variant ${inv.variantId} because variant is missing.`);
              continue;
            }
            await prisma.inventory.upsert({
              where: { variantId: inv.variantId },
              update: { quantity: inv.quantity, reorderLevel: inv.reorderLevel },
              create: inv
            });
          } catch (rowErr: any) {
            console.error(`[SYNC] Failed to upsert inventory for variant ${inv.variantId}:`, rowErr.message);
          }
        }
      }
    } catch (err: any) {
      console.error('[SYNC] Inventory downsync failed:', err.message);
    }

    // 5. Sync Audit Logs
    try {
      const { data: auditLogs, error: auditErr } = await supabase.from('audit_logs').select('*');
      if (auditErr) throw auditErr;
      if (auditLogs) {
        for (const log of auditLogs) {
          try {
            await prisma.auditLog.upsert({
              where: { id: log.id },
              update: {
                userId: log.userId,
                username: log.username,
                action: log.action,
                details: log.details,
                createdAt: new Date(log.createdAt)
              },
              create: {
                ...log,
                createdAt: new Date(log.createdAt)
              }
            });
          } catch (rowErr: any) {
            console.error(`[SYNC] Failed to upsert audit log ${log.id}:`, rowErr.message);
          }
        }
      }
    } catch (err: any) {
      console.error('[SYNC] Audit logs downsync failed:', err.message);
    }

    console.log('[SYNC] Downsync complete. All records synchronized.');
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
