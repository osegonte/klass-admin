'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Layers } from 'lucide-react'
import Link from 'next/link'

interface Props {
  displayName: string
  email:       string
}

export default function BuilderNav({ displayName, email }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">

          <div className="flex items-center gap-3">
            <Layers size={14} className="text-gray-400" />
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-900">
              KLASS / BUILDER
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              {displayName}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-400 px-2.5 py-1.5 rounded transition-colors"
            >
              <LogOut size={11} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}