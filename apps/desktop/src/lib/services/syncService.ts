import { createClient } from '@supabase/supabase-js';
import { prisma } from '../prisma';

const mapToSnakeCase = (obj: any) => {
  const mapping: any = {
    'basePrice': 'basePrice',
    'costPrice': 'costPrice',
    'categoryId': 'categoryId',
    'imageUrl': 'imageUrl',
    'productId': 'productId',
    'reorderLevel': 'reorderLevel',
    'variantId': 'variantId',
    'totalAmount': 'totalAmount',
    'paymentMethod': 'paymentMethod',
    'customerId': 'customerId',
    'saleId': 'saleId'
  };

  const sensitiveFields = ['visiblePassword'];
  const newObj: any = {};
  
  Object.keys(obj).forEach(key => {
    if (sensitiveFields.includes(key)) return;
    
    const newKey = mapping[key] || key;
    let value = obj[key];
    if (value instanceof Date) {
      value = value.toISOString();
    }
    newObj[newKey] = value;
  });
  return newObj;
};

export const syncToCloud = async (supabaseUrl: string, supabaseKey: string) => {
  // Use Service Role key if available in env to bypass RLS, otherwise use provided key
  const finalKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
  
  const sanitizedUrl = supabaseUrl.trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/+$/, '');
  const sanitizedKey = finalKey.trim();

  const supabase = createClient(sanitizedUrl, sanitizedKey);
  const logs: string[] = [];

  const tables = [
    { name: 'users', model: (prisma as any).user, idField: 'id' },
    { name: 'categories', model: (prisma as any).category, idField: 'id' },
    { name: 'products', model: (prisma as any).product, idField: 'id' },
    { name: 'product_variants', model: (prisma as any).productVariant, idField: 'id' },
    { name: 'inventory', model: (prisma as any).inventory, idField: 'variantId' },
    { name: 'customers', model: (prisma as any).customer, idField: 'id' },
    { name: 'sales', model: (prisma as any).sale, idField: 'id' },
    { name: 'sale_items', model: (prisma as any).saleItem, idField: 'id' }
  ];

  try {
    const { error: healthError } = await supabase.from('categories').select('id', { count: 'exact', head: true });

    if (healthError) {
      if (healthError.message.includes('Invalid path')) {
        throw new Error(`Connection Error: The URL provided (${sanitizedUrl}) appears to be incorrect.`);
      }
      throw new Error(`Connectivity Check Failed: ${healthError.message}`);
    }

    for (const table of tables) {
      const data = await table.model.findMany();
      if (data.length > 0) {
        const cleanData = data.map((item: any) => mapToSnakeCase(item));

        const { error } = await supabase
          .from(table.name)
          .upsert(cleanData, { onConflict: table.idField });

        if (error) {
          throw new Error(`Error syncing ${table.name}: ${error.message}`);
        }
        logs.push(`Successfully synced ${data.length} records to ${table.name}`);
      } else {
        logs.push(`No records to sync for ${table.name}`);
      }
    }

    await prisma.syncLog.create({
      data: { status: 'SUCCESS', message: logs.join('; ') }
    });

    await prisma.setting.upsert({
      where: { key: 'lastSync' },
      update: { value: new Date().toISOString() },
      create: { key: 'lastSync', value: new Date().toISOString() }
    });

    return { success: true, logs };
  } catch (error: any) {
    console.error('Sync failed:', error);
    await prisma.syncLog.create({
      data: { status: 'FAILED', message: error.message }
    });
    throw error;
  }
};

export const clearLogs = async () => {
  return await prisma.syncLog.deleteMany({});
};
