import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventoryService';

export async function POST(request: Request) {
  try {
    const { variantId, quantityChange, type, reason } = await request.json();
    const inventory = await inventoryService.updateStock(variantId, quantityChange, type, reason);
    
    if ((global as any).io) {
      (global as any).io.emit('stock_updated', { variantId, quantity: inventory.quantity });
    }

    return NextResponse.json(inventory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
