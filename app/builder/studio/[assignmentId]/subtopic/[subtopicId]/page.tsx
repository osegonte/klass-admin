import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SubtopicCourseBuilder from '@/components/builder/SubtopicCourseBuilder'
import ObjectivesPanel from '@/components/builder/ObjectivesPanel'

export default async function SubtopicStudioPage({
  params,
}: {
  params: Promise<{ assignmentId: string; subtopicId: string }>
}) {
  const { assignmentId, subtopicId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignment } = await supabase
    .from('topic_assignments')
    .select(`
      id, status,
      topics ( id, name, subjects ( name ) ),
      exams ( name )
    `)
    .eq('id', assignmentId)
    .eq('builder_id', user!.id)
    .single()

  if (!assignment) notFound()

  const { data: subtopic } = await supabase
    .from('subtopics')
    .select('id, name')
    .eq('id', subtopicId)
    .single()

  if (!subtopic) notFound()

  const { data: submission } = await supabase
    .from('subtopic_submissions')
    .select('id, status, feedback')
    .eq('assignment_id', assignmentId)
    .eq('subtopic_id', subtopicId)
    .maybeSingle()

  const topic = assignment.topics as any

  const { data: examTopics } = await supabase
    .from('exam_topics')
    .select('objectives, exams ( name )')
    .eq('topic_id', topic.id)

  const allObjectives = (examTopics ?? []).flatMap((et: any) =>
    (et.objectives ?? []).map((obj: any) => ({
      exam:      et.exams?.name ?? '',
      objective: typeof obj === 'string' ? obj : obj.text,
    }))
  )

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 flex-wrap">
        <Link href="/builder" className="hover:text-gray-700 transition-colors">
          Queue
        </Link>
        <span>/</span>
        <Link
          href={`/builder/studio/${assignmentId}`}
          className="hover:text-gray-700 transition-colors"
        >
          {topic?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{subtopic.name}</span>
      </div>

      {submission?.status === 'needs_revision' && submission.feedback && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">
            Revision Required
          </p>
          <p className="text-sm text-red-700">{submission.feedback}</p>
        </div>
      )}

      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
          {subtopic.name}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {topic?.name} · {topic?.subjects?.name}
        </p>
      </div>

      {allObjectives.length > 0 && (
        <div className="mb-6">
          <ObjectivesPanel objectives={allObjectives} />
        </div>
      )}

      <SubtopicCourseBuilder
        assignmentId={assignmentId}
        subtopicId={subtopicId}
        submissionStatus={submission?.status ?? null}
      />
    </div>
  )
}