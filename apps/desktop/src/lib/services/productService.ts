import { prisma } from '../prisma';
import { cloudSyncService } from './cloudSyncService';

export const productService = {
  async getAllProducts() {
    return await prisma.product.findMany({
      include: {
        category: true,
        variants: {
          include: {
            inventory: true
          }
        }
      }
    });
  },

  async getAllCategories() {
    return await prisma.category.findMany();
  },

  async createCategory(data: { name: string }) {
    const { name } = data;
    const category = await prisma.category.create({
      data: { name }
    });

    cloudSyncService.queueSync('Category', category.id).catch(console.error);
    return category;
  },

  async deleteCategory(id: string) {
    // Safety check: Prevent deletion if products exist in this category
    const productCount = await prisma.product.count({
      where: { categoryId: id }
    });
    if (productCount > 0) {
      throw new Error('This category contains products and cannot be deleted. Please reclassify or delete its products first.');
    }

    const category = await prisma.category.delete({
      where: { id }
    });

    try {
      const supabase = await cloudSyncService.getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.from('categories').delete().eq('id', id);
        console.log(`[SYNC] Category delete response for ID ${id}:`, { data, error });
        if (error) {
          console.error('Supabase category deletion failed:', error);
        }
      }
    } catch (err) {
      console.error('Failed to sync category deletion to cloud:', err);
    }

    return category;
  },

  async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          include: {
            inventory: true
          }
        }
      }
    });
  },

  async createProduct(data: any) {
    const { name, brand, basePrice, imageUrl, categoryId, variants } = data;
    
    const product = await prisma.product.create({
      data: {
        name,
        brand,
        basePrice,
        imageUrl,
        category: { connect: { id: categoryId } },
        variants: {
          create: variants.map((v: any) => ({
            size: v.size,
            color: v.color,
            sku: v.sku || null,
            barcode: v.barcode || null,
            inventory: {
              create: {
                quantity: parseInt(v.quantity) || 0,
                reorderLevel: parseInt(v.reorderLevel) || 5
              }
            }
          }))
        }
      },
      include: {
        variants: {
          include: {
            inventory: true
          }
        }
      }
    });

    cloudSyncService.queueSync('Product', product.id).catch(console.error);
    return product;
  },

  async updateProduct(id: string, data: any) {
    const { name, brand, basePrice, costPrice, imageUrl, categoryId } = data;
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        basePrice,
        costPrice,
        imageUrl,
        category: { connect: { id: categoryId } }
      }
    });

    cloudSyncService.queueSync('Product', product.id).catch(console.error);
    return product;
  },

  async deleteProduct(id: string) {
    return await prisma.product.delete({
      where: { id }
    });
  }
};
