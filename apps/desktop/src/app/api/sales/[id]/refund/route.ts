import { NextResponse } from 'next/server';
import { salesService } from '@/lib/services/salesService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    const { refundedBy, reason } = await request.json();

    if (!refundedBy || !reason) {
      return NextResponse.json({ error: "RefundedBy and Reason are required fields." }, { status: 400 });
    }

    const sale = await salesService.refundSale(saleId, refundedBy, reason);

    if ((global as any).io) {
      (global as any).io.emit('sale_refunded', sale);
    }

    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
