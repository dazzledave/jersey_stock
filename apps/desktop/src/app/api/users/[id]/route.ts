import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/utils/supabaseClient';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { role, isActive, password, updaterId, updaterUsername } = await request.json();
    
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};
    const auditDetails: string[] = [];

    // 1. Handle Role Change
    if (role && role !== user.role) {
      updateData.role = role;
      auditDetails.push(`changed role from ${user.role} to ${role}`);
      
      // Update Supabase Auth Meta
      try {
        const supabase = await getSupabaseAdmin();
        if (supabase) {
          const email = `${user.username.toLowerCase()}@jersey-stock.com`;
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const authUser = users.find(u => u.email === email);
          if (authUser) {
            await supabase.auth.admin.updateUserById(authUser.id, {
              user_metadata: { role, username: user.username }
            });
          }
        }
      } catch (err) {
        console.warn('Supabase sync skipped during user role update');
      }
    }

    // 2. Handle Deactivation Toggle
    if (typeof isActive === 'boolean' && isActive !== user.isActive) {
      updateData.isActive = isActive;
      auditDetails.push(isActive ? 'reactivated account' : 'disabled / deactivated account');
    }

    // 3. Handle Password Reset
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
      auditDetails.push('performed a password reset');

      // Update Supabase Auth Password
      try {
        const supabase = await getSupabaseAdmin();
        if (supabase) {
          const email = `${user.username.toLowerCase()}@jersey-stock.com`;
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const authUser = users.find(u => u.email === email);
          if (authUser) {
            await supabase.auth.admin.updateUserById(authUser.id, {
              password: password
            });
          }
        }
      } catch (err) {
        console.warn('Supabase sync skipped during user password reset');
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData
    });

    // Write audit trail for security logs
    if (auditDetails.length > 0) {
      const log = await prisma.auditLog.create({
        data: {
          userId: updaterId || null,
          username: updaterUsername || 'System',
          action: 'STAFF_MANAGEMENT',
          details: `User "${user.username}" (ID: ${user.id}) was modified: ${auditDetails.join(', ')}.`
        }
      });
      try {
        const { cloudSyncService } = require('@/lib/services/cloudSyncService');
        cloudSyncService.queueSync('AuditLog', log.id).catch(console.error);
      } catch (e) {}
    }

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

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

    const url = new URL(request.url);
    const updaterId = url.searchParams.get('updaterId');
    const updaterUsername = url.searchParams.get('updaterUsername');

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

    // Write audit trail for security logs
    const log = await prisma.auditLog.create({
      data: {
        userId: updaterId || null,
        username: updaterUsername || 'System',
        action: 'STAFF_MANAGEMENT',
        details: `User "${user.username}" (ID: ${user.id}) was permanently hard-deleted from register.`
      }
    });
    try {
      const { cloudSyncService } = require('@/lib/services/cloudSyncService');
      cloudSyncService.queueSync('AuditLog', log.id).catch(console.error);
    } catch (e) {}

    return NextResponse.json({ message: 'User deleted successfully from local and cloud' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
