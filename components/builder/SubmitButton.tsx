'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send, AlertCircle } from 'lucide-react'

interface Props {
  assignmentId:   string
  blockCount:     number
  flashcardCount: number
  isTopicLevel:   boolean
  subtopicId:     string | null
}

export default function SubmitButton({
  assignmentId, blockCount, flashcardCount, isTopicLevel, subtopicId,
}: Props) {
  const router = useRouter()
  const [open,       setOpen]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const issues: string[] = []
  if (blockCount === 0)     issues.push('No content blocks added yet')
  if (flashcardCount === 0) issues.push('No flashcards added yet')

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    const supabase = createClient()

    if (isTopicLevel) {
      const { error } = await supabase
        .from('topic_assignments')
        .update({ status: 'submitted' })
        .eq('id', assignmentId)

      if (error) { setError(error.message); setSubmitting(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('subtopic_submissions')
        .upsert({
          assignment_id: assignmentId,
          subtopic_id:   subtopicId,
          builder_id:    user!.id,
          status:        'submitted',
          submitted_at:  new Date().toISOString(),
        }, { onConflict: 'assignment_id,subtopic_id' })

      if (error) { setError(error.message); setSubmitting(false); return }
    }

    setOpen(false)
    setSubmitting(false)
    router.push('/builder')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
      >
        <Send size={11} />
        Submit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:rounded-lg sm:max-w-md shadow-xl rounded-t-xl">

            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-900">
                Submit for Review
              </h2>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <CheckItem label={`${blockCount} content block${blockCount !== 1 ? 's' : ''}`} passed={blockCount > 0} />
                <CheckItem label={`${flashcardCount} flashcard${flashcardCount !== 1 ? 's' : ''}`} passed={flashcardCount > 0} />
              </div>

              {issues.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-3">
                  <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 mb-1">
                      Are you sure you want to submit?
                    </p>
                    {issues.map((issue, i) => (
                      <p key={i} className="text-xs text-amber-700">{issue}</p>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <p className="text-xs text-gray-400">
                Once submitted, your coordinator will review this content.
                You will be notified if revisions are needed.
              </p>
            </div>

            <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-200">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 text-xs text-gray-500 px-4 py-2.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2.5 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors font-medium"
              >
                <Send size={11} />
                {submitting ? 'Submitting…' : 'Submit for review'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

function CheckItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
        passed ? 'bg-green-500' : 'bg-gray-200'
      }`}>
        {passed && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={`text-xs ${passed ? 'text-gray-700' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  )
}
