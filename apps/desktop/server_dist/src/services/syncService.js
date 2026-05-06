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
    'saleId': 'sale_id'
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

const syncToCloud = async (supabaseUrl, supabaseKey) => {
  const sanitizedUrl = supabaseUrl.trim()
    .replace(/\/rest\/v1\/?$/, '') 
    .replace(/\/+$/, '');
  const sanitizedKey = supabaseKey.trim();

  const supabase = createClient(sanitizedUrl, sanitizedKey);
  const logs = [];

  const tables = [
    { name: 'categories', model: prisma.category, idField: 'id' },
    { name: 'products', model: prisma.product, idField: 'id' },
    { name: 'product_variants', model: prisma.productVariant, idField: 'id' },
    { name: 'inventory', model: prisma.inventory, idField: 'variant_id' },
    { name: 'customers', model: prisma.customer, idField: 'id' },
    { name: 'sales', model: prisma.sale, idField: 'id' },
    { name: 'sale_items', model: prisma.saleItem, idField: 'id' }
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
        const cleanData = data.map(item => mapToSnakeCase(item));

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

    return { success: true, logs };
  } catch (error) {
    console.error('Sync failed:', error);
    await prisma.syncLog.create({
      data: { status: 'FAILED', message: error.message }
    });
    throw error;
  }
};

const clearLogs = async () => {
  return await prisma.syncLog.deleteMany({});
};

module.exports = { syncToCloud, clearLogs };
