const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const syncToCloud = async (supabaseUrl, supabaseKey) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const logs = [];

  const tables = [
    { name: 'categories', model: prisma.category },
    { name: 'products', model: prisma.product },
    { name: 'product_variants', model: prisma.productVariant },
    { name: 'inventory', model: prisma.inventory },
    { name: 'customers', model: prisma.customer },
    { name: 'sales', model: prisma.sale },
    { name: 'sale_items', model: prisma.saleItem }
  ];

  try {
    for (const table of tables) {
      const data = await table.model.findMany();
      if (data.length > 0) {
        // Prepare data (remove circular refs or prisma-specific fields if any)
        const cleanData = data.map(item => {
          const newItem = { ...item };
          // Ensure dates are strings for Supabase
          Object.keys(newItem).forEach(key => {
            if (newItem[key] instanceof Date) {
              newItem[key] = newItem[key].toISOString();
            }
          });
          return newItem;
        });

        const { error } = await supabase
          .from(table.name)
          .upsert(cleanData, { onConflict: 'id' });

        if (error) {
          throw new Error(`Error syncing ${table.name}: ${error.message}`);
        }
        logs.push(`Successfully synced ${data.length} records to ${table.name}`);
      } else {
        logs.push(`No records to sync for ${table.name}`);
      }
    }

    // Log success
    await prisma.syncLog.create({
      data: {
        status: 'SUCCESS',
        message: logs.join('; ')
      }
    });

    return { success: true, logs };
  } catch (error) {
    console.error('Sync failed:', error);
    await prisma.syncLog.create({
      data: {
        status: 'FAILED',
        message: error.message
      }
    });
    throw error;
  }
};

module.exports = { syncToCloud };
