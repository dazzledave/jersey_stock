import { NextResponse } from 'next/server';
import { productService } from '@/lib/services/productService';

export async function GET() {
  try {
    const products = await productService.getAllProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await productService.createProduct(body);
    
    // Socket emit via global io
    if ((global as any).io) {
      (global as any).io.emit('product_created', product);
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
