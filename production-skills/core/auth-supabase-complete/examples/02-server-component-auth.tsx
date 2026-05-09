/**
 * Example 2: Server Component Authentication
 *
 * Production-ready server components with:
 * - Server-side user authentication
 * - Profile data fetching
 * - Protected pages
 * - Redirect for unauthenticated users
 */

import { redirect } from 'next/navigation'
import {
  getUser,
  getProfile,
  getUserWithProfile,
  signOut,
} from '@project-forge/auth-supabase-complete/auth'

// Configuration from environment
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

// Example 1: Protected Dashboard Page
export default async function DashboardPage() {
  // Get authenticated user - redirect to login if not authenticated
  const user = await getUser(config)

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">
          Welcome back, <strong>{user.email}</strong>!
        </p>
        <p className="text-sm text-gray-500 mt-2">User ID: {user.id}</p>
      </div>
    </div>
  )
}

// Example 2: Profile Page with User Data
export async function ProfilePage() {
  // Get user with profile in a single call
  const result = await getUserWithProfile(config)

  if (!result) {
    redirect('/auth/login')
  }

  const { user, profile } = result

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Email</label>
          <p className="text-lg">{user.email}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">Display Name</label>
          <p className="text-lg">{profile?.display_name || 'Not set'}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">Member Since</label>
          <p className="text-lg">
            {new Date(user.created_at || '').toLocaleDateString()}
          </p>
        </div>

        {profile?.avatar_url && (
          <div>
            <label className="text-sm font-medium text-gray-500">Avatar</label>
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-24 h-24 rounded-full mt-2"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Example 3: User Header Component
export async function UserHeader() {
  const user = await getUser(config)

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/auth/login"
          className="px-4 py-2 text-blue-600 hover:text-blue-700"
        >
          Sign In
        </a>
        <a
          href="/auth/signup"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign Up
        </a>
      </div>
    )
  }

  const profile = await getProfile(config)

  return (
    <div className="flex items-center gap-4">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt="Avatar"
          className="w-10 h-10 rounded-full"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          {user.email?.[0].toUpperCase()}
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-medium">{profile?.display_name || user.email}</span>
        <span className="text-sm text-gray-500">{user.email}</span>
      </div>
      <form action={async () => {
        'use server'
        await signOut(config)
      }}>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
        >
          Sign Out
        </button>
      </form>
    </div>
  )
}

// Example 4: Conditional Content Based on Auth
export async function ConditionalContent() {
  const user = await getUser(config)

  return (
    <div className="container mx-auto px-4 py-8">
      {user ? (
        <div className="bg-green-50 border border-green-200 p-6 rounded">
          <h2 className="text-xl font-bold mb-2">Premium Content</h2>
          <p>
            Welcome, {user.email}! You have access to premium features.
          </p>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded">
          <h2 className="text-xl font-bold mb-2">Sign in to access premium content</h2>
          <p className="mb-4">
            Create a free account to unlock additional features.
          </p>
          <a
            href="/auth/signup"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Get Started
          </a>
        </div>
      )}
    </div>
  )
}

// Example 5: Settings Page with Custom Profile Table
interface CustomUserProfile {
  id: string
  username: string
  bio: string
  website: string
}

export async function SettingsPage() {
  const user = await getUser(config)

  if (!user) {
    redirect('/auth/login')
  }

  // Using custom profile table name with generic type
  const profile = await getProfile<CustomUserProfile>(config, 'user_profiles')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Username</label>
          <p className="text-lg">{profile?.username || 'Not set'}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">Bio</label>
          <p className="text-lg">{profile?.bio || 'Not set'}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">Website</label>
          <p className="text-lg">
            {profile?.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {profile.website}
              </a>
            ) : (
              'Not set'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

// Example 6: Admin-Only Page
export async function AdminPage() {
  const user = await getUser(config)

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin (fetch profile with is_admin field)
  const profile = await getProfile<{ id: string; is_admin: boolean }>(config)

  if (!profile?.is_admin) {
    // Redirect non-admin users to home page
    redirect('/')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-red-50 border border-red-200 p-6 rounded">
        <p className="text-red-800">
          ⚠️ Admin-only area. Only users with admin privileges can access this page.
        </p>
      </div>
    </div>
  )
}
