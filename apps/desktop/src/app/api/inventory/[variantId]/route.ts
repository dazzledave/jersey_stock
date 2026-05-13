import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventoryService';

export async function PUT(
  request: Request,
  { params }: { params: { variantId: string } }
) {
  try {
    const { quantity } = await request.json();
    const inventory = await inventoryService.setStock(params.variantId, quantity);
    
    if ((global as any).io) {
      (global as any).io.emit('stock_updated', { variantId: params.variantId, quantity: inventory.quantity });
    }

    return NextResponse.json(inventory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
