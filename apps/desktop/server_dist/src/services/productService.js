const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudSyncService = require('./cloudSyncService');

const productService = {
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

  async createCategory(data) {
    const { name } = data;
    const category = await prisma.category.create({
      data: { name }
    });

    // Queue for Cloud Sync
    cloudSyncService.queueSync('Category', category.id).catch(console.error);

    return category;
  },

  async getProductById(id) {
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

  async createProduct(data) {
    const { name, brand, basePrice, imageUrl, categoryId, variants } = data;
    
    const product = await prisma.product.create({
      data: {
        name,
        brand,
        basePrice,
        imageUrl,
        category: { connect: { id: categoryId } },
        variants: {
          create: variants.map(v => ({
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

    // Queue for Cloud Sync
    cloudSyncService.queueSync('Product', product.id).catch(console.error);

    return product;
  },

  async updateProduct(id, data) {
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

    // Queue for Cloud Sync
    cloudSyncService.queueSync('Product', product.id).catch(console.error);

    return product;
  },

  async deleteProduct(id) {
    return await prisma.product.delete({
      where: { id }
    });
  }
};

module.exports = productService;
