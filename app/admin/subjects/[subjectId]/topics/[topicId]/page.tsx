import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NewItemButton from '@/components/admin/NewItemButton'
import OverviewEditor from '@/components/admin/OverviewEditor'
import PrerequisitesEditor from '@/components/admin/PrerequisitesEditor'
import ExamSubtopicMapper from '@/components/admin/ExamSubtopicMapper'
import ExamObjectivesEditor from '@/components/admin/ExamObjectivesEditor'

export default async function TopicDetailPage({
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
    .select('id, name, overview, is_active')
    .eq('id', topicId)
    .single()

  if (!topic || !subject) notFound()

  const { data: subtopics } = await supabase
    .from('subtopics')
    .select('id, name, subtopic_order, is_active')
    .eq('topic_id', topicId)
    .order('subtopic_order')

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
        <span className="text-gray-900">{topic.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8 pb-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
            {topic.name}
          </h1>
          <p className="text-xs text-gray-400 mt-1">{subject.name}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded font-medium ${
          topic.is_active
            ? 'bg-green-50 text-green-700'
            : 'bg-gray-100 text-gray-400'
        }`}>
          {topic.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex flex-col gap-10">

        {/* Overview */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Overview
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              A broad description of what this topic covers.
            </p>
          </div>
          <OverviewEditor
            table="topics"
            id={topicId}
            initialValue={topic.overview ?? ''}
          />
        </section>

        {/* Exam Objectives */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Objectives
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Objectives per exam. Switch between exams to view and edit.
              The course grows as new objectives are added.
            </p>
          </div>
          <ExamObjectivesEditor topicId={topicId} subjectId={subjectId} />
        </section>

        {/* Prerequisites */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Prerequisites
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Topics a student should complete before this one.
            </p>
          </div>
          <PrerequisitesEditor level="topic" id={topicId} />
        </section>

        {/* Subtopics */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                Subtopics
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {subtopics?.length ?? 0} subtopics under {topic.name}.
              </p>
            </div>
            <NewItemButton type="subtopic" topicId={topicId} subjectId={subjectId} />
          </div>

          {(!subtopics || subtopics.length === 0) && (
            <div className="border border-dashed border-gray-300 rounded p-10 text-center">
              <p className="text-sm text-gray-400">No subtopics yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Break this topic into focused learning units.
              </p>
            </div>
          )}

          {subtopics && subtopics.length > 0 && (
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
                      Subtopic
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subtopics.map((subtopic: any) => (
                    <tr key={subtopic.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{subtopic.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 tabular-nums">
                          {subtopic.subtopic_order + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          subtopic.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {subtopic.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/subjects/${subjectId}/topics/${topicId}/subtopics/${subtopic.id}`}
                          className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Exam Coverage */}
        {subtopics && subtopics.length > 0 && (
          <section>
            <div className="mb-3">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                Exam Coverage
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Tick which subtopics each exam requires.
              </p>
            </div>
            <ExamSubtopicMapper
              topicId={topicId}
              subjectId={subjectId}
              subtopics={subtopics}
            />
          </section>
        )}

      </div>
    </div>
  )
}