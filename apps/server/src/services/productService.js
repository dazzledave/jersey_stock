const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    
    return await prisma.product.create({
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
  },

  async updateProduct(id, data) {
    const { name, brand, basePrice, costPrice, imageUrl, categoryId } = data;
    return await prisma.product.update({
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
  },

  async deleteProduct(id) {
    return await prisma.product.delete({
      where: { id }
    });
  }
};

module.exports = productService;
