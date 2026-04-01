'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

interface Exam    { id: string; name: string }
interface Builder { id: string; display_name: string; email: string }

interface Props {
  topicId:  string
  exams:    Exam[]
  builders: Builder[]
}

export default function AssignTopicButton({ topicId, exams, builders }: Props) {
  const router = useRouter()
  const [open,      setOpen]      = useState(false)
  const [examId,    setExamId]    = useState(exams[0]?.id ?? '')
  const [builderId, setBuilderId] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleAssign = async () => {
    if (!examId || !builderId) {
      setError('Select an exam and a builder.')
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('topic_assignments')
      .insert({
        topic_id:       topicId,
        exam_id:        examId,
        builder_id:     builderId,
        coordinator_id: user!.id,
        status:         'assigned',
      })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setOpen(false)
    setBuilderId('')
    setSaving(false)
    router.refresh()
  }

  const close = () => {
    setOpen(false)
    setError(null)
    setBuilderId('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-2 rounded hover:bg-gray-700 transition-colors"
      >
        <Plus size={12} />
        Assign
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:rounded-lg sm:max-w-md shadow-xl flex flex-col rounded-t-xl sm:rounded-xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-900">
                Assign Topic
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 p-5">

              {/* Exam */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  Exam
                </label>
                <select
                  value={examId}
                  onChange={e => setExamId(e.target.value)}
                  className="border border-gray-200 rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                  ))}
                </select>
              </div>

              {/* Builder */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  Builder
                </label>
                {builders.length === 0 ? (
                  <p className="text-xs text-gray-400 border border-gray-200 rounded px-3 py-2.5">
                    No builders available. Ask an admin to add builders.
                  </p>
                ) : (
                  <select
                    value={builderId}
                    onChange={e => setBuilderId(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Select a builder…</option>
                    {builders.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.display_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button
                onClick={close}
                className="text-xs text-gray-500 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={saving || !builderId}
                className="text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Assigning…' : 'Assign'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}