/**
 * Example 7: Profile Setup After Signup
 *
 * Production-ready profile setup flow with:
 * - Multi-step onboarding
 * - Profile photo upload
 * - Form validation
 * - Progress indicator
 * - Database insertion
 * - Error handling
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@project-forge/auth-supabase-complete/client'
import { useRouter } from 'next/navigation'

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

// Example 1: Single-Step Profile Setup
export function SimpleProfileSetup() {
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient(config)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be signed in to complete your profile')
        setLoading(false)
        return
      }

      // Create or update profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        display_name: displayName,
        bio: bio || null,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Complete Your Profile</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium mb-1">
          Display Name *
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Tell us about yourself..."
        />
        <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? 'Saving...' : 'Complete Setup'}
      </button>
    </form>
  )
}

// Example 2: Multi-Step Onboarding Flow
type OnboardingStep = 'personal' | 'avatar' | 'preferences' | 'complete'

export function MultiStepOnboarding() {
  const [step, setStep] = useState<OnboardingStep>('personal')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketing: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const steps: OnboardingStep[] = ['personal', 'avatar', 'preferences', 'complete']
  const currentStepIndex = steps.indexOf(step)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex])
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient(config)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be signed in')
        setLoading(false)
        return
      }

      // Upload avatar if provided
      let uploadedAvatarUrl = null
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          })

        if (uploadError) {
          setError('Failed to upload avatar')
          setLoading(false)
          return
        }

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        uploadedAvatarUrl = urlData.publicUrl
      }

      // Create profile with all data
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        display_name: displayName,
        bio: bio || null,
        avatar_url: uploadedAvatarUrl,
        email_notifications: preferences.emailNotifications,
        marketing_emails: preferences.marketing,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      // Move to complete step
      setStep('complete')
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Step 1: Personal Information */}
      {step === 'personal' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Tell us about yourself</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Display Name *</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
          </div>

          <button
            onClick={handleNext}
            disabled={!displayName}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Avatar Upload */}
      {step === 'avatar' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Add a profile photo</h2>
          <p className="text-gray-600">
            Help others recognize you by adding a profile picture
          </p>

          <div className="flex flex-col items-center space-y-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}

            <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <span>Choose Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              {avatarUrl ? 'Continue' : 'Skip'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 'preferences' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Notification Preferences</h2>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) =>
                  setPreferences({ ...preferences, emailNotifications: e.target.checked })
                }
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive email notifications about your account activity
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) =>
                  setPreferences({ ...preferences, marketing: e.target.checked })
                }
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-gray-600">
                  Receive updates about new features and promotions
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <div className="text-center space-y-4 py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold">You're all set!</h2>
          <p className="text-gray-600">
            Your profile has been created successfully. Welcome aboard!
          </p>

          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  )
}

// Example 3: Profile Setup with Username Validation
export function ProfileSetupWithUsernameCheck() {
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setAvailable(null)
      return
    }

    setChecking(true)
    const supabase = createClient(config)

    // Check if username is already taken
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', value)
      .single()

    setChecking(false)
    setAvailable(!data && !error)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        checkUsername(username)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username])

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Username *</label>
      <div className="relative">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
          placeholder="johndoe"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {checking && <span className="text-gray-400">...</span>}
          {!checking && available === true && (
            <span className="text-green-600">✓</span>
          )}
          {!checking && available === false && (
            <span className="text-red-600">✗</span>
          )}
        </div>
      </div>
      {available === false && (
        <p className="text-xs text-red-600 mt-1">Username is already taken</p>
      )}
      {available === true && (
        <p className="text-xs text-green-600 mt-1">Username is available</p>
      )}
    </div>
  )
}
