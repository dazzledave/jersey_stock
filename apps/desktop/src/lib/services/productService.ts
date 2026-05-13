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
