import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { userId, password, recoveryKey } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (password !== undefined) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }
      return NextResponse.json({ verified: true });
    }

    if (recoveryKey !== undefined) {
      if (!user.recoveryKey) {
        return NextResponse.json({ error: 'No recovery key set for this user' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(recoveryKey.toUpperCase(), user.recoveryKey);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect secret code' }, { status: 400 });
      }
      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ error: 'Missing password or recovery key' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
