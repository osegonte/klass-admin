'use client'

import Link from 'next/link'

interface Subtopic {
  id:             string
  name:           string
  subtopic_order: number
}

interface Submission {
  id:          string
  subtopic_id: string
  status:      string
  feedback:    string | null
}

interface Props {
  assignmentId: string
  topicId:      string
  subtopics:    Subtopic[]
  submissions:  Submission[]
}

const STATUS_STYLE: Record<string, string> = {
  draft:          'bg-amber-50 text-amber-700',
  submitted:      'bg-blue-50 text-blue-700',
  approved:       'bg-green-50 text-green-700',
  needs_revision: 'bg-red-50 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  draft:          'In Progress',
  submitted:      'Submitted',
  approved:       'Approved',
  needs_revision: 'Needs Revision',
}

export default function SubtopicsList({
  assignmentId, subtopics, submissions,
}: Props) {
  const getSubmission = (subtopicId: string) =>
    submissions.find(s => s.subtopic_id === subtopicId)

  const isUnlocked = (index: number) => {
    if (index === 0) return true
    const prev    = subtopics[index - 1]
    const prevSub = getSubmission(prev.id)
    return prevSub?.status === 'approved'
  }

  if (subtopics.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center">
        <p className="text-sm text-gray-400">No subtopics for this topic.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {subtopics.map((subtopic, index) => {
        const submission = getSubmission(subtopic.id)
        const unlocked   = isUnlocked(index)
        const status     = submission?.status ?? 'not_started'

        return (
          <div
            key={subtopic.id}
            className={`bg-white border rounded-lg px-4 py-3 flex items-center justify-between gap-3 ${
              status === 'needs_revision' ? 'border-red-200' :
              status === 'submitted'      ? 'border-blue-200' :
              'border-gray-200'
            } ${!unlocked ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-gray-300 tabular-nums shrink-0 w-5">
                {subtopic.subtopic_order + 1}.
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {subtopic.name}
                </p>
                {submission?.feedback && status === 'needs_revision' && (
                  <p className="text-xs text-red-500 mt-0.5 truncate">
                    {submission.feedback}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {status !== 'not_started' && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-500'
                }`}>
                  {STATUS_LABEL[status] ?? status}
                </span>
              )}

              {unlocked && status !== 'approved' && status !== 'submitted' && (
                <Link
                  href={`/builder/studio/${assignmentId}/subtopic/${subtopic.id}`}
                  className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                >
                  {status === 'needs_revision' ? 'Revise' : status === 'draft' ? 'Continue' : 'Build'}
                </Link>
              )}

              {unlocked && status === 'submitted' && (
                <Link
                  href={`/builder/studio/${assignmentId}/subtopic/${subtopic.id}`}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  View →
                </Link>
              )}

              {!unlocked && (
                <span className="text-xs text-gray-300">Locked</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
