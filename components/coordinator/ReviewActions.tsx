'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  assignmentId:  string
  subtopicId:    string | null
  isTopicLevel:  boolean
  currentStatus: string
}

export default function ReviewActions({
  assignmentId, subtopicId, isTopicLevel, currentStatus,
}: Props) {
  const router = useRouter()
  const [feedback,  setFeedback]  = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [saving,    setSaving]    = useState(false)

  const handleApprove = async () => {
    setSaving(true)
    const supabase = createClient()

    if (isTopicLevel) {
      await supabase
        .from('topic_assignments')
        .update({ status: 'approved' })
        .eq('id', assignmentId)
    } else {
      await supabase
        .from('subtopic_submissions')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('assignment_id', assignmentId)
        .eq('subtopic_id', subtopicId)
    }

    setSaving(false)
    router.push(`/coordinator/assignments/${assignmentId}`)
    router.refresh()
  }

  const handleNeedsRevision = async () => {
    if (!feedback.trim()) {
      setShowFeedback(true)
      return
    }

    setSaving(true)
    const supabase = createClient()

    if (isTopicLevel) {
      await supabase
        .from('topic_assignments')
        .update({ status: 'needs_revision', feedback: feedback.trim() })
        .eq('id', assignmentId)
    } else {
      await supabase
        .from('subtopic_submissions')
        .update({
          status:      'needs_revision',
          feedback:    feedback.trim(),
          reviewed_at: new Date().toISOString(),
        })
        .eq('assignment_id', assignmentId)
        .eq('subtopic_id', subtopicId)
    }

    setSaving(false)
    router.push(`/coordinator/assignments/${assignmentId}`)
    router.refresh()
  }

  if (currentStatus === 'approved') {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle size={14} className="text-green-600" />
        <span className="text-sm text-green-700 font-medium">Approved</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {showFeedback && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 uppercase tracking-wide">
            Feedback for builder
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Explain what needs to be revised…"
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            autoFocus
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={saving}
          className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-4 py-2.5 rounded hover:bg-green-700 disabled:opacity-40 transition-colors flex-1 justify-center font-medium"
        >
          <CheckCircle size={14} />
          Approve
        </button>
        <button
          onClick={handleNeedsRevision}
          disabled={saving}
          className="flex items-center gap-1.5 text-sm bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded hover:bg-red-50 disabled:opacity-40 transition-colors flex-1 justify-center font-medium"
        >
          <XCircle size={14} />
          {showFeedback ? 'Send feedback' : 'Needs revision'}
        </button>
      </div>
    </div>
  )
}