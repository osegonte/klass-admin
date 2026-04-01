'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Role = 'admin' | 'coordinator' | 'builder'

interface Teacher {
  id:         string
  email:      string
  name:       string
  role:       Role | null
  is_active:  boolean
  created_at: string
}

interface Props {
  pending: Teacher[]
  active:  Teacher[]
}

export default function TeachersClient({ pending: initialPending, active: initialActive }: Props) {
  const [pending,  setPending]  = useState<Teacher[]>(initialPending)
  const [active,   setActive]   = useState<Teacher[]>(initialActive)
  const [saving,   setSaving]   = useState<string | null>(null)
  const [assignTo, setAssignTo] = useState<Record<string, Role>>({})

  const approveTeacher = async (teacher: Teacher) => {
    const role = assignTo[teacher.id] ?? 'builder'
    setSaving(teacher.id)
    const supabase = createClient()
    await supabase
      .from('teachers')
      .update({ role, is_active: true })
      .eq('id', teacher.id)
    setPending(prev => prev.filter(t => t.id !== teacher.id))
    setActive(prev => [{ ...teacher, role, is_active: true }, ...prev])
    setSaving(null)
  }

  const updateRole = async (id: string, role: Role) => {
    setSaving(id)
    const supabase = createClient()
    await supabase.from('teachers').update({ role }).eq('id', id)
    setActive(prev => prev.map(t => t.id === id ? { ...t, role } : t))
    setSaving(null)
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    setSaving(id)
    const supabase = createClient()
    await supabase.from('teachers').update({ is_active: !is_active }).eq('id', id)
    setActive(prev => prev.map(t => t.id === id ? { ...t, is_active: !is_active } : t))
    setSaving(null)
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Pending section */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
            Pending approval
          </h2>
          <div className="border border-amber-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-amber-700">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-amber-700">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-amber-700">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-amber-700">Assign role</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {pending.map(teacher => (
                  <tr key={teacher.id} className="bg-white hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{teacher.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{teacher.email}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(teacher.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={assignTo[teacher.id] ?? 'builder'}
                        onChange={e => setAssignTo(prev => ({ ...prev, [teacher.id]: e.target.value as Role }))}
                        disabled={saving === teacher.id}
                        className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
                      >
                        <option value="builder">Builder</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => approveTeacher(teacher)}
                        disabled={saving === teacher.id}
                        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {saving === teacher.id ? 'Approving…' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active teachers */}
      <div>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
          Active teachers
        </h2>

        {active.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded p-12 text-center">
            <p className="text-sm text-gray-400">No active teachers yet.</p>
            <p className="text-xs text-gray-400 mt-1">Approve pending accounts above to get started.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {active.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{teacher.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{teacher.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={teacher.role ?? ''}
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
          </div>
        )}
      </div>

    </div>
  )
}