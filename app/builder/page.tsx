import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_STYLE: Record<string, string> = {
  assigned:       'bg-gray-100 text-gray-500',
  in_progress:    'bg-amber-50 text-amber-700',
  submitted:      'bg-blue-50 text-blue-700',
  approved:       'bg-green-50 text-green-700',
  needs_revision: 'bg-red-50 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  assigned:       'Assigned',
  in_progress:    'In Progress',
  submitted:      'Submitted',
  approved:       'Approved',
  needs_revision: 'Needs Revision',
}

export default async function BuilderQueue() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignments } = await supabase
    .from('topic_assignments')
    .select(`
      id, status, assigned_at,
      topics (
        id, name,
        subjects ( name )
      ),
      exams ( name )
    `)
    .eq('builder_id', user!.id)
    .order('assigned_at', { ascending: false })

  const active   = (assignments ?? []).filter((a: any) =>
    !['approved'].includes(a.status)
  )
  const completed = (assignments ?? []).filter((a: any) =>
    a.status === 'approved'
  )

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
          My Queue
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {active.length} active · {completed.length} completed
        </p>
      </div>

      {(assignments ?? []).length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-400">No assignments yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Your coordinator will assign topics to you shortly.
          </p>
        </div>
      )}

      {/* Active assignments */}
      {active.length > 0 && (
        <div className="flex flex-col gap-2 mb-8">
          {active.map((a: any) => (
            <Link
              key={a.id}
              href={`/builder/studio/${a.id}`}
              className={`bg-white border rounded-lg px-4 py-4 flex items-center justify-between gap-3 hover:border-gray-400 transition-colors group ${
                a.status === 'needs_revision'
                  ? 'border-red-200'
                  : 'border-gray-200'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {a.topics?.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {a.topics?.subjects?.name} · {a.exams?.name}
                </p>
                {a.status === 'needs_revision' && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    Coordinator sent feedback — revision needed
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_STYLE[a.status]}`}>
                  {STATUS_LABEL[a.status]}
                </span>
                <span className="text-gray-300 group-hover:text-gray-600 transition-colors">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">
            Completed
          </h2>
          <div className="flex flex-col gap-2">
            {completed.map((a: any) => (
              <Link
                key={a.id}
                href={`/builder/studio/${a.id}`}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3 hover:border-gray-400 transition-colors group opacity-60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {a.topics?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.topics?.subjects?.name} · {a.exams?.name}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded font-medium bg-green-50 text-green-700 shrink-0">
                  Approved
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}