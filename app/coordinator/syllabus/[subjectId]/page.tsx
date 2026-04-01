import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CoordinatorSubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  const { data: topics } = await supabase
    .from('topics')
    .select(`
      id, name, topic_order,
      subtopics ( count ),
      topic_assignments ( id, status )
    `)
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .order('topic_order')

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link
          href="/coordinator/syllabus"
          className="hover:text-gray-700 transition-colors"
        >
          Syllabus
        </Link>
        <span>/</span>
        <span className="text-gray-900">{subject.name}</span>
      </div>

      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
          {subject.name}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {topics?.length ?? 0} topics
        </p>
      </div>

      {(!topics || topics.length === 0) && (
        <div className="border border-dashed border-gray-300 rounded p-10 text-center">
          <p className="text-sm text-gray-400">No topics yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {topics?.map((topic: any) => {
          const subtopicCount  = topic.subtopics?.[0]?.count ?? 0
          const assignments    = topic.topic_assignments ?? []
          const hasAssignments = assignments.length > 0
          const allApproved    = hasAssignments && assignments.every((a: any) => a.status === 'approved')
          const anyInProgress  = assignments.some((a: any) =>
            ['assigned', 'in_progress', 'submitted'].includes(a.status)
          )

          return (
            <Link
              key={topic.id}
              href={`/coordinator/syllabus/${subjectId}/topics/${topic.id}`}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-gray-400 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {topic.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {subtopicCount} subtopics
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {allApproved && (
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-green-50 text-green-700">
                    Approved
                  </span>
                )}
                {anyInProgress && !allApproved && (
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-700">
                    In progress
                  </span>
                )}
                {!hasAssignments && (
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-400">
                    Unassigned
                  </span>
                )}
                <span className="text-gray-300 group-hover:text-gray-600 transition-colors">
                  →
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}