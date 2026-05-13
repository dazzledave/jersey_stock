import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/utils/supabaseClient';
import { cloudSyncService } from '@/lib/services/cloudSyncService';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, role } = await request.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'STAFF'
      }
    });

    cloudSyncService.queueSync('User', user.id).catch(console.error);

    // Supabase Sync
    try {
      const supabase = await getSupabaseAdmin();
      if (supabase) {
        const email = `${username.toLowerCase()}@jersey-stock.com`;
        const { error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: role || 'STAFF', username }
        });
        if (error) console.error(`[SUPABASE] Failed to create auth user: ${error.message}`);
      }
    } catch (err) {
      console.warn('Supabase sync skipped during user creation');
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
