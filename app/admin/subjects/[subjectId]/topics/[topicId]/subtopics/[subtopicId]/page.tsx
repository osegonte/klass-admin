import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OverviewEditor from '@/components/admin/OverviewEditor'
import PrerequisitesEditor from '@/components/admin/PrerequisitesEditor'
import ExamSubtopicObjectivesEditor from '@/components/admin/ExamSubtopicObjectivesEditor'

export default async function SubtopicDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string; topicId: string; subtopicId: string }>
}) {
  const { subjectId, topicId, subtopicId } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('id', subjectId)
    .single()

  const { data: topic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('id', topicId)
    .single()

  const { data: subtopic } = await supabase
    .from('subtopics')
    .select('id, name, overview, is_active')
    .eq('id', subtopicId)
    .single()

  if (!subtopic || !topic || !subject) notFound()

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/admin/subjects" className="hover:text-gray-700 transition-colors">
          Subjects
        </Link>
        <span>/</span>
        <Link
          href={`/admin/subjects/${subjectId}`}
          className="hover:text-gray-700 transition-colors"
        >
          {subject.name}
        </Link>
        <span>/</span>
        <Link
          href={`/admin/subjects/${subjectId}/topics/${topicId}`}
          className="hover:text-gray-700 transition-colors"
        >
          {topic.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{subtopic.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8 pb-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
            {subtopic.name}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {subject.name} / {topic.name}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded font-medium ${
          subtopic.is_active
            ? 'bg-green-50 text-green-700'
            : 'bg-gray-100 text-gray-400'
        }`}>
          {subtopic.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex flex-col gap-8">

        {/* Overview */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Overview
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              What this subtopic covers in focused detail.
            </p>
          </div>
          <OverviewEditor
            table="subtopics"
            id={subtopicId}
            initialValue={subtopic.overview ?? ''}
          />
        </section>

        {/* Exam Objectives */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Objectives
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Objectives per exam for this subtopic.
            </p>
          </div>
          <ExamSubtopicObjectivesEditor
            subtopicId={subtopicId}
            topicId={topicId}
            subjectId={subjectId}
          />
        </section>

        {/* Prerequisites */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Prerequisites
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Subtopics a student should complete before this one.
            </p>
          </div>
          <PrerequisitesEditor level="subtopic" id={subtopicId} />
        </section>

      </div>
    </div>
  )
}