/**
 * Example 3: API Route with Authentication Middleware
 *
 * Production-ready API routes with:
 * - Authentication required
 * - Type-safe request/response
 * - Error handling
 * - Database operations with authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@project-forge/auth-supabase-complete/require-auth'

// Configuration from environment
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

// Example 1: GET endpoint - Fetch user's data
export async function GET(request: NextRequest) {
  // Require authentication - returns user and supabase client or error response
  const { user, error, supabase } = await requireAuth(config, request)

  if (error) {
    return error // Returns 401 Unauthorized if not authenticated
  }

  try {
    // Fetch user's posts using authenticated client
    // RLS policies will automatically filter to current user
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (postsError) {
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      posts,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 2: POST endpoint - Create new resource
export async function POST(request: NextRequest) {
  const { user, error, supabase } = await requireAuth(config, request)

  if (error) {
    return error
  }

  try {
    // Parse request body
    const body = await request.json()
    const { title, content } = body

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Create post with authenticated user's ID
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title,
        content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    return NextResponse.json(post, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 3: PATCH endpoint - Update resource
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error, supabase } = await requireAuth(config, request)

  if (error) {
    return error
  }

  try {
    const { id } = params
    const body = await request.json()
    const { title, content } = body

    // First, verify the post belongs to the current user
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this post' },
        { status: 403 }
      )
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        title: title || undefined,
        content: content || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedPost)
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 4: DELETE endpoint - Remove resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error, supabase } = await requireAuth(config, request)

  if (error) {
    return error
  }

  try {
    const { id } = params

    // Verify ownership before deleting
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this post' },
        { status: 403 }
      )
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Post deleted successfully' },
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

// Example 5: Complex query with joins and filters
export async function getWithJoins(request: NextRequest) {
  const { user, error, supabase } = await requireAuth(config, request)

  if (error) {
    return error
  }

  try {
    // Fetch posts with author profile and comments count
    const { data: posts, error: queryError } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!user_id (
          display_name,
          avatar_url
        ),
        comments:comments (count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (queryError) {
      console.error('Query error:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example 6: Pagination support
export async function getWithPagination(request: NextRequest) {
  const { user, error, supabase } = await requireAuth(config, request)

  if (error) {
    return error
  }

  try {
    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Fetch paginated results
    const { data: posts, error: queryError, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (queryError) {
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

// Example 7: File upload with authentication
export async function uploadFile(request: NextRequest) {
  const { user, error, supabase } = await requireAuth(config, request)

  if (error) {
    return error
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(uploadData.path)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: uploadData.path,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
