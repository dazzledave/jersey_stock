import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cloudSyncService } from '@/lib/services/cloudSyncService';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { sales: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, phone, email, address } = await request.json();
    const customer = await prisma.customer.create({
      data: { name, phone, email, address }
    });
    cloudSyncService.queueSync('Customer', customer.id).catch(console.error);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
