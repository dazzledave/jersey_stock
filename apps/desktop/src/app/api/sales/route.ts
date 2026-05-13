import { NextResponse } from 'next/server';
import { salesService } from '@/lib/services/salesService';

export async function GET() {
  try {
    const sales = await salesService.getAllSales();
    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sale = await salesService.createSale(body);
    
    if ((global as any).io) {
      (global as any).io.emit('sale_created', sale);
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
