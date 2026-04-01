'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Role = 'admin' | 'coordinator' | 'builder'

interface Teacher {
  id:           string
  email:        string
  display_name: string
  role:         Role
  is_active:    boolean
  created_at:   string
}

interface Props {
  teachers: Teacher[]
}

const ROLE_STYLES: Record<Role, string> = {
  admin:       'bg-gray-900 text-white',
  coordinator: 'bg-blue-50 text-blue-700',
  builder:     'bg-amber-50 text-amber-700',
}

export default function TeachersClient({ teachers: initial }: Props) {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>(initial)
  const [saving,   setSaving]   = useState<string | null>(null)

  const updateRole = async (id: string, role: Role) => {
    setSaving(id)
    const supabase = createClient()
    await supabase.from('teachers').update({ role }).eq('id', id)
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, role } : t))
    setSaving(null)
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    setSaving(id)
    const supabase = createClient()
    await supabase.from('teachers').update({ is_active: !is_active }).eq('id', id)
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, is_active: !is_active } : t))
    setSaving(null)
  }

  if (teachers.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded p-12 text-center">
        <p className="text-sm text-gray-400">No teachers yet.</p>
        <p className="text-xs text-gray-400 mt-1">
          Teachers appear here after they sign up.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
              Email
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
              Role
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {teachers.map(teacher => (
            <tr key={teacher.id} className="hover:bg-stone-50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{teacher.display_name}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-xs text-gray-500">{teacher.email}</p>
              </td>
              <td className="px-4 py-3">
                <select
                  value={teacher.role}
                  disabled={saving === teacher.id}
                  onChange={e => updateRole(teacher.id, e.target.value as Role)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
                >
                  <option value="admin">Admin</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="builder">Builder</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  teacher.is_active
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {teacher.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => toggleActive(teacher.id, teacher.is_active)}
                  disabled={saving === teacher.id}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  {teacher.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-4 py-3 bg-stone-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          New teachers sign up themselves. Their role defaults to Builder.
          Promote them here after signup.
        </p>
      </div>
    </div>
  )
}