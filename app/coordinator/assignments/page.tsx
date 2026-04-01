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

const STATUS_ORDER = ['submitted', 'needs_revision', 'in_progress', 'assigned', 'approved']

export default async function AssignmentsPage() {
  const supabase = await createClient()

  const { data: assignments } = await supabase
    .from('topic_assignments')
    .select(`
      id, status, assigned_at,
      topics (
        id, name,
        subjects ( name )
      ),
      exams ( name ),
      teachers!topic_assignments_builder_id_fkey ( display_name )
    `)
    .order('assigned_at', { ascending: false })

  const grouped: Record<string, typeof assignments> = {}
  for (const status of STATUS_ORDER) {
    const items = (assignments ?? []).filter((a: any) => a.status === status)
    if (items.length > 0) grouped[status] = items
  }

  const total      = assignments?.length ?? 0
  const submitted  = (assignments ?? []).filter((a: any) => a.status === 'submitted').length
  const needsRevision = (assignments ?? []).filter((a: any) => a.status === 'needs_revision').length

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
            Assignments
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {total} total
            {submitted > 0 && ` · ${submitted} awaiting review`}
            {needsRevision > 0 && ` · ${needsRevision} needs revision`}
          </p>
        </div>
      </div>

      {total === 0 && (
        <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-400">No assignments yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Assign topics to builders from the Syllabus section.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {STATUS_ORDER.filter(s => grouped[s]).map(status => (
          <section key={status}>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
              {STATUS_LABEL[status]}
              <span className="ml-2 text-gray-300 font-normal normal-case">
                {grouped[status]!.length}
              </span>
            </h2>

            <div className="flex flex-col gap-2">
              {grouped[status]!.map((a: any) => (
                <Link
                  key={a.id}
                  href={`/coordinator/assignments/${a.id}`}
                  className={`bg-white border rounded-lg px-4 py-3 flex items-center justify-between gap-3 hover:border-gray-400 transition-colors group ${
                    a.status === 'submitted'      ? 'border-blue-200' :
                    a.status === 'needs_revision' ? 'border-red-200'  :
                    'border-gray-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {a.topics?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.topics?.subjects?.name} · {a.exams?.name} · {a.teachers?.display_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_STYLE[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                    <span className="text-gray-300 group-hover:text-gray-600 transition-colors">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}