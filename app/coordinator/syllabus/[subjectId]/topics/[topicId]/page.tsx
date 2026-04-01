import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AssignTopicButton from '@/components/coordinator/AssignTopicButton'
import MaterialsEditor from '@/components/coordinator/MaterialsEditor'
import CoordinatorObjectivesEditor from '@/components/coordinator/CoordinatorObjectivesEditor'

export default async function CoordinatorTopicPage({
  params,
}: {
  params: Promise<{ subjectId: string; topicId: string }>
}) {
  const { subjectId, topicId } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('id', subjectId)
    .single()

  const { data: topic } = await supabase
    .from('topics')
    .select('id, name, overview, materials')
    .eq('id', topicId)
    .single()

  if (!topic || !subject) notFound()

  const { data: examTopics } = await supabase
    .from('exam_topics')
    .select('exam_id, objectives, exams ( name )')
    .eq('topic_id', topicId)

  const { data: subtopics } = await supabase
    .from('subtopics')
    .select('id, name, subtopic_order')
    .eq('topic_id', topicId)
    .order('subtopic_order')

  const { data: exams } = await supabase
    .from('exams')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const { data: builders } = await supabase
    .from('teachers')
    .select('id, display_name, email')
    .eq('role', 'builder')
    .eq('is_active', true)
    .order('display_name')

  const { data: assignments } = await supabase
    .from('topic_assignments')
    .select(`
      id, status, assigned_at,
      exams ( name ),
      teachers!topic_assignments_builder_id_fkey ( display_name )
    `)
    .eq('topic_id', topicId)
    .order('assigned_at', { ascending: false })

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
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 flex-wrap">
        <Link href="/coordinator/syllabus" className="hover:text-gray-700 transition-colors">
          Syllabus
        </Link>
        <span>/</span>
        <Link
          href={`/coordinator/syllabus/${subjectId}`}
          className="hover:text-gray-700 transition-colors"
        >
          {subject.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{topic.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
            {topic.name}
          </h1>
          {topic.overview && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {topic.overview}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">

        {/* Objectives */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Objectives
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Set objectives and map each one to the subtopics it covers.
            </p>
          </div>
          <CoordinatorObjectivesEditor
            topicId={topicId}
            subjectId={subjectId}
            examTopics={examTopics ?? []}
            exams={exams ?? []}
            subtopics={subtopics ?? []}
          />
        </section>

        {/* Materials */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Materials
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Reference materials for the builder. Save here before assigning.
            </p>
          </div>
          <MaterialsEditor
            topicId={topicId}
            initialValue={parsedMaterials}
          />
        </section>

        {/* Subtopics */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
            Subtopics ({subtopics?.length ?? 0})
          </h2>
          {(!subtopics || subtopics.length === 0) && (
            <p className="text-xs text-gray-400">No subtopics yet.</p>
          )}
          <div className="flex flex-col gap-1">
            {subtopics?.map((subtopic: any) => (
              <div
                key={subtopic.id}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3"
              >
                <span className="text-xs text-gray-300 tabular-nums shrink-0 w-5">
                  {subtopic.subtopic_order + 1}.
                </span>
                <p className="text-sm text-gray-700">{subtopic.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Assignments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Assignments
            </h2>
            <AssignTopicButton
              topicId={topicId}
              exams={exams ?? []}
              builders={builders ?? []}
            />
          </div>

          {(!assignments || assignments.length === 0) && (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-400">Not assigned yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Add materials and objectives above, then assign to a builder.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {assignments?.map((a: any) => (
              <div
                key={a.id}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {a.teachers?.display_name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.exams?.name} · {new Date(a.assigned_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${
                  a.status === 'approved'       ? 'bg-green-50 text-green-700'  :
                  a.status === 'submitted'      ? 'bg-blue-50 text-blue-700'    :
                  a.status === 'needs_revision' ? 'bg-red-50 text-red-600'      :
                  a.status === 'in_progress'    ? 'bg-amber-50 text-amber-700'  :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {a.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}