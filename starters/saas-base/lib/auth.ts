import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Get the current session
 * Returns null if no active session
 */
export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
})

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in protected pages/routes
 */
export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Get user profile from database (includes role and other metadata)
 * Returns null if user not authenticated or profile not found
 */
export async function getUserProfile() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

/**
 * Check if user has admin role
 */
export async function isAdmin() {
  const profile = await getUserProfile()
  return profile?.role === 'ADMIN'
}

/**
 * Require admin role - redirects to dashboard if not admin
 */
export async function requireAdmin() {
  const profile = await getUserProfile()
  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  return profile
}
