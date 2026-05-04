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
    const { name, brand, basePrice, description, categoryId, variants } = data;
    
    return await prisma.product.create({
      data: {
        name,
        brand,
        basePrice,
        description,
        category: { connect: { id: categoryId } },
        variants: {
          create: variants.map(v => ({
            size: v.size,
            color: v.color,
            sku: v.sku,
            barcode: v.barcode,
            inventory: {
              create: {
                quantity: v.quantity || 0,
                reorderLevel: v.reorderLevel || 5
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
    const { name, brand, basePrice, description, categoryId } = data;
    return await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        basePrice,
        description,
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
