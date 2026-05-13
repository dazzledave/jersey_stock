import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/utils/supabaseClient';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Find user to get username
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Cleanup Supabase Auth
    try {
      const supabase = await getSupabaseAdmin();
      if (supabase) {
        const email = `${user.username.toLowerCase()}@jersey-stock.com`;
        
        // Find user by email first to get Auth ID
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError) {
          const authUser = users.find(u => u.email === email);
          if (authUser) {
            await supabase.auth.admin.deleteUser(authUser.id);
            console.log(`[SUPABASE] Deleted auth user for: ${user.username}`);
          }
        }
      }
    } catch (err) {
      console.warn('[SUPABASE] Auth cleanup failed, continuing local deletion');
    }

    // 3. Delete locally
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'User deleted successfully from local and cloud' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
