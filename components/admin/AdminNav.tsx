'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Users, LogOut, Upload } from 'lucide-react'
import Link from 'next/link'

interface Props {
  displayName: string
  email:       string
}

const navItems = [
  { label: 'SUBJECTS', href: '/admin/subjects', icon: BookOpen },
  { label: 'TEACHERS', href: '/admin/teachers', icon: Users    },
  { label: 'IMPORT',   href: '/admin/import',   icon: Upload   },
]

export default function AdminNav({ displayName, email }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-12">

        {/* Logo + nav */}
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-900 pr-6 border-r border-gray-200">
            KLASS / ADMIN
          </span>

          <nav className="flex items-center">
            {navItems.map(({ label, href, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 h-12 text-xs font-medium tracking-wider border-b-2 transition-colors ${
                    active
                      ? 'text-gray-900 border-gray-900'
                      : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon size={12} strokeWidth={2} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 hidden sm:block">{email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-2.5 py-1.5 rounded transition-colors"
          >
            <LogOut size={11} />
            Sign out
          </button>
        </div>

      </div>
    </header>
  )
}