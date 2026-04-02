import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>
}) {
  const { assignmentId } = await params
  const supabase = await createClient()

  const { data: assignment } = await supabase
    .from('topic_assignments')
    .select(`
      id, status, assigned_at, feedback,
      topics (
        id, name, subject_id,
        subjects ( name ),
        subtopics ( id, name, subtopic_order )
      ),
      exams ( id, name ),
      teachers!topic_assignments_builder_id_fkey ( display_name, email )
    `)
    .eq('id', assignmentId)
    .single()

  if (!assignment) notFound()

  const topic     = assignment.topics   as any
  const exam      = assignment.exams    as any
  const builder   = assignment.teachers as any
  const subtopics = (topic?.subtopics ?? [])
    .sort((a: any, b: any) => a.subtopic_order - b.subtopic_order)

  const { data: submissions } = await supabase
    .from('subtopic_submissions')
    .select('id, subtopic_id, status, feedback, submitted_at')
    .eq('assignment_id', assignmentId)

  const getSubmission = (subtopicId: string) =>
    submissions?.find(s => s.subtopic_id === subtopicId)

  const topicSubmitted = ['submitted', 'approved', 'needs_revision'].includes(assignment.status)

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 flex-wrap">
        <Link href="/coordinator/assignments" className="hover:text-gray-700 transition-colors">
          Assignments
        </Link>
        <span>/</span>
        <span className="text-gray-900">{topic?.name}</span>
      </div>

      <div className="mb-6 pb-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
            {topic?.name}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {topic?.subjects?.name} · {exam?.name} · {builder?.display_name}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${
          assignment.status === 'approved'       ? 'bg-green-50 text-green-700'  :
          assignment.status === 'submitted'      ? 'bg-blue-50 text-blue-700'    :
          assignment.status === 'needs_revision' ? 'bg-red-50 text-red-600'      :
          assignment.status === 'in_progress'    ? 'bg-amber-50 text-amber-700'  :
          'bg-gray-100 text-gray-500'
        }`}>
          {assignment.status.replace('_', ' ')}
        </span>
      </div>

      {assignment.feedback && assignment.status === 'needs_revision' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">
            Feedback sent
          </p>
          <p className="text-sm text-red-700">{assignment.feedback}</p>
        </div>
      )}

      <div className="flex flex-col gap-8">

        {/* Topic course */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Topic Course
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Must be approved before subtopics unlock.
            </p>
          </div>

          <div className={`bg-white border rounded-lg px-4 py-3 flex items-center justify-between gap-3 ${
            assignment.status === 'submitted' ? 'border-blue-200' : 'border-gray-200'
          }`}>
            <div>
              <p className="text-sm font-medium text-gray-900">{topic?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                assignment.status === 'approved'       ? 'bg-green-50 text-green-700'  :
                assignment.status === 'submitted'      ? 'bg-blue-50 text-blue-700'    :
                assignment.status === 'needs_revision' ? 'bg-red-50 text-red-600'      :
                assignment.status === 'in_progress'    ? 'bg-amber-50 text-amber-700'  :
                'bg-gray-100 text-gray-500'
              }`}>
                {assignment.status.replace('_', ' ')}
              </span>
              {topicSubmitted && assignment.status !== 'approved' && (
                <Link
                  href={`/coordinator/assignments/${assignmentId}/review/topic`}
                  className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                >
                  Review
                </Link>
              )}
              {assignment.status === 'approved' && (
                <Link
                  href={`/coordinator/assignments/${assignmentId}/review/topic`}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  View →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Subtopics */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Subtopics
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Unlock after topic course is approved.
            </p>
          </div>

          {subtopics.length === 0 && (
            <p className="text-xs text-gray-400">No subtopics for this topic.</p>
          )}

          <div className="flex flex-col gap-2">
            {subtopics.map((subtopic: any, index: number) => {
              const submission = getSubmission(subtopic.id)
              const isLocked   = assignment.status !== 'approved'
              const status     = submission?.status ?? 'not_started'

              return (
                <div
                  key={subtopic.id}
                  className={`bg-white border rounded-lg px-4 py-3 flex items-center justify-between gap-3 ${
                    status === 'submitted' ? 'border-blue-200' : 'border-gray-200'
                  } ${isLocked ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-300 tabular-nums shrink-0 w-5">
                      {index + 1}.
                    </span>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {subtopic.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      status === 'approved'       ? 'bg-green-50 text-green-700'  :
                      status === 'submitted'      ? 'bg-blue-50 text-blue-700'    :
                      status === 'needs_revision' ? 'bg-red-50 text-red-600'      :
                      status === 'draft'          ? 'bg-amber-50 text-amber-700'  :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {status === 'not_started' ? 'Not started' : status.replace('_', ' ')}
                    </span>
                    {status === 'submitted' && !isLocked && (
                      <Link
                        href={`/coordinator/assignments/${assignmentId}/review/${subtopic.id}`}
                        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                      >
                        Review
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}