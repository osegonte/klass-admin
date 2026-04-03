import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReviewActions from '@/components/coordinator/ReviewActions'

export default async function ReviewTopicPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>
}) {
  const { assignmentId } = await params
  const supabase = await createClient()

  const { data: assignment } = await supabase
    .from('topic_assignments')
    .select(`
      id, status,
      topics ( id, name, subjects ( name ) ),
      exams ( name ),
      teachers!topic_assignments_builder_id_fkey ( display_name )
    `)
    .eq('id', assignmentId)
    .single()

  if (!assignment) notFound()

  const topic   = assignment.topics as any
  const topicId = topic?.id

  const { data: blocks } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('topic_id', topicId)
    .order('block_order')

  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('*')
    .eq('topic_id', topicId)
    .order('card_order')

  const BLOCK_LABEL: Record<string, string> = {
    definition: 'Definition', explanation: 'Explanation',
    formula: 'Formula', example: 'Example', keypoint: 'Key Point',
    note: 'Note', diagram: 'Diagram', table: 'Table',
  }

  const BLOCK_COLOR: Record<string, string> = {
    definition: 'border-l-purple-400', explanation: 'border-l-blue-400',
    formula: 'border-l-amber-400', example: 'border-l-green-400',
    keypoint: 'border-l-yellow-400', note: 'border-l-gray-300',
    diagram: 'border-l-teal-400', table: 'border-l-slate-400',
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 flex-wrap">
        <Link href="/coordinator/assignments" className="hover:text-gray-700 transition-colors">
          Assignments
        </Link>
        <span>/</span>
        <Link
          href={`/coordinator/assignments/${assignmentId}`}
          className="hover:text-gray-700 transition-colors"
        >
          {topic?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Review Course</span>
      </div>

      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
          {topic?.name}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {topic?.subjects?.name} · Built by {(assignment.teachers as any)?.display_name}
        </p>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        {(!blocks || blocks.length === 0) && (
          <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center">
            <p className="text-sm text-gray-400">No content blocks yet.</p>
          </div>
        )}

        {blocks?.map((block: any) => (
          <div
            key={block.id}
            className={`bg-white border border-gray-200 border-l-4 ${BLOCK_COLOR[block.type] ?? 'border-l-gray-200'} rounded-lg p-4`}
          >
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
              {BLOCK_LABEL[block.type] ?? block.type}
            </p>
            {block.title && (
              <p className="text-sm font-semibold text-gray-900 mb-1">{block.title}</p>
            )}
            {block.body && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {block.body}
              </p>
            )}
            {block.analogy && (
              <p className="text-xs text-gray-500 mt-2 italic">Analogy: {block.analogy}</p>
            )}
            {block.breakdown && (
              <p className="text-xs text-gray-500 mt-2">Breakdown: {block.breakdown}</p>
            )}
            {block.steps && Array.isArray(block.steps) && block.steps.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {block.steps.map((step: any, i: number) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="text-gray-300 shrink-0">Step {i + 1}.</span>
                    <div>
                      <span className="font-mono text-gray-800">{step.expression}</span>
                      {step.talkingPoint && (
                        <span className="text-gray-500 ml-2">— {step.talkingPoint}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {flashcards && flashcards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
            Flashcards ({flashcards.length})
          </h2>
          <div className="flex flex-col gap-2">
            {flashcards.map((card: any) => (
              <div
                key={card.id}
                className="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-3"
              >
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Front</p>
                  <p className="text-sm text-gray-800">{card.front || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Back</p>
                  <p className="text-sm text-gray-800">{card.back || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 bg-stone-50 border-t border-gray-200 pt-4 pb-6">
        <ReviewActions
          assignmentId={assignmentId}
          subtopicId={null}
          isTopicLevel={true}
          currentStatus={assignment.status}
        />
      </div>
    </div>
  )
}