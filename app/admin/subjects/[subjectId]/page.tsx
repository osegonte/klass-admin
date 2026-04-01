import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NewItemButton from '@/components/admin/NewItemButton'
import TrackSelector from '@/components/admin/TrackSelector'

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, description, is_active')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, description, is_active, topic_order')
    .eq('subject_id', subjectId)
    .order('topic_order')

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, name')
    .order('name')

  const { data: subjectTracks } = await supabase
    .from('subject_tracks')
    .select('track_id')
    .eq('subject_id', subjectId)

  const assignedTrackIds = subjectTracks?.map(st => st.track_id) ?? []

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/admin/subjects" className="hover:text-gray-700 transition-colors">
          Subjects
        </Link>
        <span>/</span>
        <span className="text-gray-900">{subject.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8 pb-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
            {subject.name}
          </h1>
          {subject.description && (
            <p className="text-xs text-gray-400 mt-1">{subject.description}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded font-medium ${
          subject.is_active
            ? 'bg-green-50 text-green-700'
            : 'bg-gray-100 text-gray-400'
        }`}>
          {subject.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex flex-col gap-8">

        {/* Tracks */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Tracks
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Which curriculum tracks this subject belongs to.
            </p>
          </div>
          <TrackSelector
            subjectId={subjectId}
            tracks={tracks ?? []}
            assignedTrackIds={assignedTrackIds}
          />
        </section>

        {/* Topics */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                Topics
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {topics?.length ?? 0} topics under {subject.name}.
              </p>
            </div>
            <NewItemButton type="topic" subjectId={subjectId} />
          </div>

          {(!topics || topics.length === 0) && (
            <div className="border border-dashed border-gray-300 rounded p-10 text-center">
              <p className="text-sm text-gray-400">No topics yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Add the first topic to start building the curriculum.
              </p>
            </div>
          )}

          {topics && topics.length > 0 && (
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
                      Topic
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
                  {topics.map((topic: any) => (
                    <tr key={topic.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{topic.name}</p>
                        {topic.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{topic.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 tabular-nums">
                          {topic.topic_order + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          topic.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {topic.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/subjects/${subjectId}/topics/${topic.id}`}
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

      </div>
    </div>
  )
}