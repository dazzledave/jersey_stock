import { prisma } from '../prisma';
import { cloudSyncService } from './cloudSyncService';

export const productService = {
  async getAllProducts() {
    return await prisma.product.findMany({
      where: { isActive: true },
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
      where: { categoryId: id, isActive: true }
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
    // 1. Get variants to delete their related records in Supabase and locally
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true }
    });

    if (!product) return null;

    const variantIds = product.variants.map(v => v.id);

    // Check if the product has associated sales (SaleItem records) to protect sales history
    let hasSales = false;
    if (variantIds.length > 0) {
      const saleItemsCount = await prisma.saleItem.count({
        where: { variantId: { in: variantIds } }
      });
      hasSales = saleItemsCount > 0;
    }

    if (hasSales) {
      // SOFT DELETE: Mark as inactive
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });
      // Queue sync update to cloud
      cloudSyncService.queueSync('Product', id).catch(console.error);
      return updatedProduct;
    }

    // HARD DELETE: For test products or products created by mistake with no sales history
    // 2. Delete related records locally to prevent foreign key constraint violations
    if (variantIds.length > 0) {
      await prisma.stockMovement.deleteMany({
        where: { variantId: { in: variantIds } }
      });
    }

    // 3. Delete from local SQLite database (variants and inventory will cascade)
    const deletedProduct = await prisma.product.delete({
      where: { id }
    });

    // 4. Delete from Supabase to prevent them from being restored during subsequent downsyncs
    try {
      const supabase = await cloudSyncService.getSupabaseClient();
      if (supabase) {
        if (variantIds.length > 0) {
          // Delete inventory entries on Supabase
          const { error: invError } = await supabase.from('inventory').delete().in('variantId', variantIds);
          if (invError) console.error('Supabase inventory deletion failed:', invError);

          // Delete variants on Supabase
          const { error: varError } = await supabase.from('product_variants').delete().in('id', variantIds);
          if (varError) console.error('Supabase variants deletion failed:', varError);
        }

        // Delete product on Supabase
        const { data, error } = await supabase.from('products').delete().eq('id', id);
        console.log(`[SYNC] Product delete response for ID ${id}:`, { data, error });
        if (error) {
          console.error('Supabase product deletion failed:', error);
        }
      }
    } catch (err) {
      console.error('Failed to sync product deletion to cloud:', err);
    }

    return deletedProduct;
  }
};
