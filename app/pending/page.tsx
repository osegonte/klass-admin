'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PendingPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
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

        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-600 text-sm">⏳</span>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Account pending</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your account has been created. An admin will review and assign your role shortly. Check back here after you have been notified.
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Wrong account?{' '}
          <button
            onClick={handleSignOut}
            className="text-gray-900 underline underline-offset-2"
          >
            Sign out
          </button>
        </p>

      </div>
    </div>
  )
}