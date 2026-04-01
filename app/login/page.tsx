'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: teacher } = await supabase
      .from('teachers')
      .select('role')
      .eq('id', user.id)
      .single()

    if (teacher?.role === 'admin')            router.push('/admin')
    else if (teacher?.role === 'coordinator') router.push('/coordinator')
    else if (teacher?.role === 'builder')     router.push('/builder')
    else                                      router.push('/pending')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <h1 className="text-xs font-semibold tracking-widest uppercase text-gray-900">
            KLASS Studio
          </h1>
          <p className="text-xs text-gray-400 mt-1">Course Content Management</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Sign in</h2>
          <p className="text-xs text-gray-400 mb-5">
            Enter your credentials to continue.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-sm py-2.5 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          No account?{' '}
          <Link href="/signup" className="text-gray-900 underline underline-offset-2">
            Request access
          </Link>
        </p>

      </div>
    </div>
  )
}