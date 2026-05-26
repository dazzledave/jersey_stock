import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventoryService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lowStockItems = await inventoryService.getLowStockItems();
    return NextResponse.json(lowStockItems);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
