import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cloudSyncService } from '@/lib/services/cloudSyncService';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, phone, email, address } = await request.json();
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: { name, phone, email, address }
    });
    cloudSyncService.queueSync('Customer', customer.id).catch(console.error);
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
