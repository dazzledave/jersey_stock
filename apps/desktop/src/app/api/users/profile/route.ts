import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getSupabaseAdmin } from '@/lib/utils/supabaseClient';

export async function PUT(request: Request) {
  try {
    const { userId, username, password, role } = await request.json();

    // 1. Get existing user to handle email changes
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw new Error('User not found');

    const data: any = {};
    if (username) data.username = username;
    if (role) data.role = role;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data
    });

    // 2. Supabase Sync (Auth & Profile)
    try {
      const supabase = await getSupabaseAdmin();
      if (supabase) {
        const oldEmail = `${existingUser.username.toLowerCase()}@jersey-stock.com`;
        const newEmail = `${updatedUser.username.toLowerCase()}@jersey-stock.com`;
        
        const updateData: any = { 
          email: newEmail,
          user_metadata: { role: updatedUser.role, username: updatedUser.username } 
        };
        if (password) updateData.password = password;
        
        // Find by OLD email to identify the correct Auth record
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError) {
          const authUser = users.find((u: any) => u.email === oldEmail);
          if (authUser) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, updateData);
            if (updateError) console.error(`[SUPABASE] Auth update failed: ${updateError.message}`);
            else console.log(`[SUPABASE] Successfully updated auth for ${updatedUser.username}`);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase sync failed during profile update');
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully', 
      user: { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
