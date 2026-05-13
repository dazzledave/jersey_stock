import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventoryService';

export async function GET() {
  try {
    const lowStockItems = await inventoryService.getLowStockItems();
    return NextResponse.json(lowStockItems);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
