import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import NewItemButton from '@/components/admin/NewItemButton'

const TRACK_ORDER = ['Science', 'Commercial', 'Art']

export default async function SubjectsPage() {
  const supabase = await createClient()

  const { data: subjects } = await supabase
    .from('subjects')
    .select(`
      id, name, is_active,
      subject_tracks ( track_id, tracks ( name ) ),
      topics ( count )
    `)
    .order('name')

  // Group by track
  const trackMap: Record<string, typeof subjects> = {}

  for (const subject of subjects ?? []) {
    const tracks = (subject.subject_tracks ?? [])
      .map((st: any) => st.tracks?.name)
      .filter(Boolean)

    for (const track of tracks) {
      if (!trackMap[track]) trackMap[track] = []
      // Avoid duplicates per track
      const already = trackMap[track]!.find((s: any) => s.id === subject.id)
      if (!already) trackMap[track]!.push(subject)
    }
  }

  const SubjectTable = ({ items }: { items: typeof subjects }) => (
    <div className="border border-gray-200 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
              Subject
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
              Topics
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-gray-500">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(items ?? []).map((subject: any) => {
            const topicCount = subject.topics?.[0]?.count ?? 0
            return (
              <tr key={subject.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{subject.name}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-500 tabular-nums">
                    {topicCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    subject.is_active
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {subject.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/subjects/${subject.id}`}
                    className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div>
      <div className="mb-8 pb-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
            Subjects
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {subjects?.length ?? 0} subjects grouped by track.
          </p>
        </div>
        <NewItemButton type="subject" />
      </div>

      <div className="flex flex-col gap-8">
        {TRACK_ORDER.filter(t => trackMap[t]?.length).map(track => (
          <section key={track}>
            <div className="mb-3">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                {track}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {trackMap[track]?.length ?? 0} subjects
              </p>
            </div>
            <SubjectTable items={trackMap[track] ?? []} />
          </section>
        ))}
      </div>
    </div>
  )
}