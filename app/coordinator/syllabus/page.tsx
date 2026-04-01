import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const TRACK_ORDER = ['Science', 'Commercial', 'Art']

export default async function SyllabusPage() {
  const supabase = await createClient()

  const { data: subjects } = await supabase
    .from('subjects')
    .select(`
      id, name, is_active,
      subject_tracks ( track_id, tracks ( name ) ),
      topics ( count )
    `)
    .eq('is_active', true)
    .order('name')

  const trackMap: Record<string, typeof subjects> = {}

  for (const subject of subjects ?? []) {
    const tracks = (subject.subject_tracks ?? [])
      .map((st: any) => st.tracks?.name)
      .filter(Boolean)

    for (const track of tracks) {
      if (!trackMap[track]) trackMap[track] = []
      const already = trackMap[track]!.find((s: any) => s.id === subject.id)
      if (!already) trackMap[track]!.push(subject)
    }
  }

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
          Syllabus
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Browse subjects and topics. Assign topics to builders from the topic page.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {TRACK_ORDER.filter(t => trackMap[t]?.length).map(track => (
          <section key={track}>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
              {track}
              <span className="ml-2 text-gray-300 normal-case font-normal">
                {trackMap[track]?.length} subjects
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(trackMap[track] ?? []).map((subject: any) => {
                const topicCount = subject.topics?.[0]?.count ?? 0
                return (
                  <Link
                    key={subject.id}
                    href={`/coordinator/syllabus/${subject.id}`}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-gray-400 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {subject.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {topicCount} topics
                      </p>
                    </div>
                    <span className="text-gray-300 group-hover:text-gray-600 transition-colors text-base">
                      →
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}