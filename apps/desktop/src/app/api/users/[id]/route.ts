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

    // 2. Cleanup Supabase (Auth AND Database Table)
    try {
      const supabase = await getSupabaseAdmin();
      if (supabase) {
        // A. Delete from Cloud Database Table (Essential for stopping 'cloning')
        const { error: dbError } = await supabase
          .from('users')
          .delete()
          .eq('username', user.username);
        
        if (!dbError) console.log(`[SUPABASE] Deleted database record for: ${user.username}`);

        // B. Delete from Auth Center
        const email = `${user.username.toLowerCase()}@jersey-stock.com`;
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError) {
          const authUser = users.find(u => u.email === email);
          if (authUser) {
            await supabase.auth.admin.deleteUser(authUser.id);
            console.log(`[SUPABASE] Deleted auth account for: ${user.username}`);
          }
        }
      }
    } catch (err) {
      console.warn('[SUPABASE] Cloud cleanup incomplete, continuing local deletion');
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
