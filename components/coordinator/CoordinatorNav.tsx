'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, ClipboardList, LogOut } from 'lucide-react'
import Link from 'next/link'

interface Props {
  displayName: string
  email:       string
}

const navItems = [
  { label: 'Syllabus',    href: '/coordinator/syllabus',    icon: BookOpen       },
  { label: 'Assignments', href: '/coordinator/assignments', icon: ClipboardList  },
]

export default function CoordinatorNav({ displayName, email }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Top row */}
        <div className="flex items-center justify-between h-12">
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-900">
            KLASS / COORDINATOR
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-400 px-2.5 py-1.5 rounded transition-colors"
            >
              <LogOut size={11} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center -mb-px">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors ${
                  active
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                <Icon size={12} />
                {label}
              </Link>
            )
          })}
        </nav>

      </div>
    </header>
  )
}