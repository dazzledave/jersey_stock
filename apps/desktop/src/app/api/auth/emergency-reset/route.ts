import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: hashedPassword },
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    return NextResponse.json({ message: 'Admin account reset to admin / admin123' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
