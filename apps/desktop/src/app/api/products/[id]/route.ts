import { NextResponse } from 'next/server';
import { productService } from '@/lib/services/productService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await productService.getProductById(params.id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const product = await productService.updateProduct(params.id, body);
    
    if ((global as any).io) {
      (global as any).io.emit('product_updated', product);
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await productService.deleteProduct(params.id);
    
    if ((global as any).io) {
      (global as any).io.emit('product_deleted', params.id);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
