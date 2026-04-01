import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BuilderStudio from '@/components/builder/BuilderStudio'

export default async function StudioPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>
}) {
  const { assignmentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignment } = await supabase
    .from('topic_assignments')
    .select(`
      id, status, feedback,
      topics (
        id, name, overview, materials,
        subjects ( name )
      ),
      exams ( name )
    `)
    .eq('id', assignmentId)
    .eq('builder_id', user!.id)
    .single()

  if (!assignment) notFound()

  const topic = assignment.topics as any
  const exam  = assignment.exams  as any

  // Get all objectives for this topic across all exams
  const { data: examTopics } = await supabase
    .from('exam_topics')
    .select('objectives, exams ( name )')
    .eq('topic_id', topic.id)

  const allObjectives = (examTopics ?? []).flatMap((et: any) =>
    (et.objectives ?? []).map((obj: string) => ({
      exam:      et.exams?.name ?? '',
      objective: obj,
    }))
  )

  // Get subtopics
  const { data: subtopics } = await supabase
    .from('subtopics')
    .select('id, name, subtopic_order')
    .eq('topic_id', topic.id)
    .order('subtopic_order')

  // Get submissions for this assignment
  const { data: submissions } = await supabase
    .from('subtopic_submissions')
    .select('id, subtopic_id, status, feedback')
    .eq('assignment_id', assignmentId)

  // Safely parse materials
  const parsedMaterials = (() => {
    if (!topic.materials) return {}
    if (typeof topic.materials === 'string') {
      try { return JSON.parse(topic.materials) } catch { return {} }
    }
    return topic.materials
  })()

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/builder" className="hover:text-gray-700 transition-colors">
          Queue
        </Link>
        <span>/</span>
        <span className="text-gray-900">{topic.name}</span>
      </div>

      {/* Feedback banner */}
      {assignment.status === 'needs_revision' && assignment.feedback && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">
            Revision Required
          </p>
          <p className="text-sm text-red-700">{assignment.feedback}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
          {topic.name}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {topic.subjects?.name} · {exam?.name}
        </p>
      </div>

      <BuilderStudio
        assignmentId={assignmentId}
        topicId={topic.id}
        topicName={topic.name}
        topicOverview={topic.overview ?? ''}
        materials={parsedMaterials}
        objectives={allObjectives}
        assignmentStatus={assignment.status}
        subtopics={subtopics ?? []}
        submissions={submissions ?? []}
      />
    </div>
  )
}
