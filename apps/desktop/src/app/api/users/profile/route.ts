import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getSupabaseAdmin } from '@/lib/utils/supabaseClient';

export async function PUT(request: Request) {
  try {
    const { userId, username, password, role } = await request.json();
    const data: any = {};
    if (username) data.username = username;
    if (role) data.role = role;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
      data.visiblePassword = password;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    // Supabase Sync
    try {
      const supabase = await getSupabaseAdmin();
      if (supabase) {
        const email = `${user.username.toLowerCase()}@jersey-stock.com`;
        const updateData: any = { user_metadata: { role: user.role } };
        if (password) updateData.password = password;
        
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError) {
          const targetUser = users.find((u: any) => u.email === email);
          if (targetUser) {
            await supabase.auth.admin.updateUserById(targetUser.id, updateData);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase sync skipped during profile update');
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully', 
      user: { id: user.id, username: user.username, role: user.role } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
