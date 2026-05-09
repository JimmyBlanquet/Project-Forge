/**
 * Example 4: Admin-Only API Routes
 *
 * Production-ready admin endpoints with:
 * - Admin authentication required
 * - User management operations
 * - System configuration
 * - Audit logging
 * - Customizable admin checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@project-forge/auth-supabase-complete/require-auth'
import { createServiceClient } from '@project-forge/auth-supabase-complete/server'

// Configuration from environment
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
}

// Example 1: List all users (admin only)
export async function GET_Users(request: NextRequest) {
  // Require admin authentication
  const { user, error, supabase } = await requireAdminAuth(config, request)

  if (error) {
    return error // Returns 401 or 403 if not admin
  }

  try {
    // Use service client to bypass RLS for admin operations
    const serviceClient = createServiceClient(config)

    // Fetch all users with their profiles
    const { data: users, error: usersError } = await serviceClient
      .from('profiles')
      .select(`
        *,
        auth_users:auth.users!id (
          email,
          created_at,
          last_sign_in_at
        )
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({ users })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 2: Update user role/permissions (admin only)
export async function PATCH_UserRole(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, error } = await requireAdminAuth(config, request)

  if (error) {
    return error
  }

  try {
    const { userId } = params
    const body = await request.json()
    const { is_admin } = body

    // Prevent admin from removing their own admin status
    if (userId === user.id && is_admin === false) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin status' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient(config)

    // Update user profile with new admin status
    const { data: updatedProfile, error: updateError } = await serviceClient
      .from('profiles')
      .update({ is_admin })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    // Log admin action for audit trail
    await serviceClient.from('audit_logs').insert({
      admin_id: user.id,
      action: 'update_user_role',
      target_user_id: userId,
      details: { is_admin },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 3: Delete user account (admin only)
export async function DELETE_User(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { user, error } = await requireAdminAuth(config, request)

  if (error) {
    return error
  }

  try {
    const { userId } = params

    // Prevent admin from deleting their own account
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient(config)

    // Delete user data (profile, posts, etc.)
    // Note: Database should have CASCADE deletes configured
    const { error: deleteError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    // Delete auth user (requires Admin API or service role key)
    // Note: This uses Supabase Admin API
    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(
      userId
    )

    if (authDeleteError) {
      console.error('Auth delete error:', authDeleteError)
      return NextResponse.json(
        { error: 'Failed to delete auth user' },
        { status: 500 }
      )
    }

    // Log admin action
    await serviceClient.from('audit_logs').insert({
      admin_id: user.id,
      action: 'delete_user',
      target_user_id: userId,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 4: Get system statistics (admin only)
export async function GET_Stats(request: NextRequest) {
  const { user, error } = await requireAdminAuth(config, request)

  if (error) {
    return error
  }

  try {
    const serviceClient = createServiceClient(config)

    // Fetch various statistics
    const [usersCount, postsCount, activeUsers] = await Promise.all([
      // Total users count
      serviceClient
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      // Total posts count
      serviceClient
        .from('posts')
        .select('*', { count: 'exact', head: true }),

      // Active users (signed in within last 7 days)
      serviceClient
        .from('profiles')
        .select('id')
        .gte('last_sign_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    return NextResponse.json({
      stats: {
        totalUsers: usersCount.count || 0,
        totalPosts: postsCount.count || 0,
        activeUsers: activeUsers.data?.length || 0,
        adminUser: {
          id: user.id,
          email: user.email,
        },
      },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 5: Bulk user operations (admin only)
export async function POST_BulkOperation(request: NextRequest) {
  const { user, error } = await requireAdminAuth(config, request)

  if (error) {
    return error
  }

  try {
    const body = await request.json()
    const { operation, userIds } = body as {
      operation: 'ban' | 'unban' | 'verify'
      userIds: string[]
    }

    if (!operation || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient(config)

    // Execute bulk operation
    let result
    switch (operation) {
      case 'ban':
        result = await serviceClient
          .from('profiles')
          .update({ is_banned: true })
          .in('id', userIds)
        break

      case 'unban':
        result = await serviceClient
          .from('profiles')
          .update({ is_banned: false })
          .in('id', userIds)
        break

      case 'verify':
        result = await serviceClient
          .from('profiles')
          .update({ is_verified: true })
          .in('id', userIds)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        )
    }

    if (result.error) {
      console.error('Bulk operation error:', result.error)
      return NextResponse.json(
        { error: 'Failed to execute bulk operation' },
        { status: 500 }
      )
    }

    // Log admin action
    await serviceClient.from('audit_logs').insert({
      admin_id: user.id,
      action: `bulk_${operation}`,
      details: { userIds, count: userIds.length },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      message: `Successfully executed ${operation} on ${userIds.length} users`,
      affectedUsers: userIds.length,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 6: Custom admin check with role-based permissions
export async function GET_CustomRoleCheck(request: NextRequest) {
  // Use custom admin field to check for "role" instead of "is_admin"
  const { user, error, supabase } = await requireAdminAuth(config, request, {
    adminField: 'role',
    profilesTable: 'user_profiles',
  })

  if (error) {
    return error
  }

  try {
    // This user has role='admin' in user_profiles table
    return NextResponse.json({
      message: 'Admin access granted',
      admin: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 7: Audit log viewer (admin only)
export async function GET_AuditLogs(request: NextRequest) {
  const { user, error } = await requireAdminAuth(config, request)

  if (error) {
    return error
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const serviceClient = createServiceClient(config)

    // Fetch audit logs with admin info
    const { data: logs, error: logsError } = await serviceClient
      .from('audit_logs')
      .select(`
        *,
        admin:profiles!admin_id (
          display_name,
          email
        ),
        target_user:profiles!target_user_id (
          display_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (logsError) {
      console.error('Logs fetch error:', logsError)
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({ logs })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
