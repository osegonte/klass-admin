'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

interface Exam {
  id:   string
  name: string
}

interface Props {
  topicId:   string
  subjectId: string
}

export default function ExamObjectivesEditor({ topicId, subjectId }: Props) {
  const [exams,       setExams]       = useState<Exam[]>([])
  const [activeExam,  setActiveExam]  = useState<string | null>(null)
  const [objectives,  setObjectives]  = useState<Record<string, string[]>>({})
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()

      const { data: examData } = await supabase
        .from('exams')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (examData) {
        setExams(examData)
        if (examData.length > 0) setActiveExam(examData[0].id)
      }

      const { data: examTopics } = await supabase
        .from('exam_topics')
        .select('exam_id, objectives')
        .eq('topic_id', topicId)

      if (examTopics) {
        const map: Record<string, string[]> = {}
        for (const row of examTopics) {
          map[row.exam_id] = row.objectives ?? []
        }
        setObjectives(map)
      }

      setLoading(false)
    }
    fetch()
  }, [topicId])

  const getObjectives = (examId: string) => objectives[examId] ?? ['']

  const update = (examId: string, index: number, value: string) => {
    setObjectives(prev => ({
      ...prev,
      [examId]: (prev[examId] ?? ['']).map((o, i) => i === index ? value : o),
    }))
    setSaved(false)
  }

  const add = (examId: string) => {
    setObjectives(prev => ({
      ...prev,
      [examId]: [...(prev[examId] ?? []), ''],
    }))
  }

  const remove = (examId: string, index: number) => {
    setObjectives(prev => ({
      ...prev,
      [examId]: (prev[examId] ?? []).filter((_, i) => i !== index),
    }))
    setSaved(false)
  }

  const handleSave = async (examId: string) => {
    setSaving(true)
    const supabase = createClient()
    const cleaned  = (objectives[examId] ?? []).filter(o => o.trim() !== '')

    await supabase
      .from('exam_topics')
      .upsert({
        exam_id:    examId,
        topic_id:   topicId,
        subject_id: subjectId,
        objectives: cleaned,
      }, { onConflict: 'exam_id,topic_id' })

    setObjectives(prev => ({ ...prev, [examId]: cleaned.length ? cleaned : [''] }))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <p className="text-xs text-gray-400">Loading…</p>
  if (exams.length === 0) return <p className="text-xs text-gray-400">No exams configured.</p>

  return (
    <div className="flex flex-col gap-4">

      {/* Exam tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {exams.map(exam => {
          const count = (objectives[exam.id] ?? []).filter(o => o.trim()).length
          return (
            <button
              key={exam.id}
              onClick={() => { setActiveExam(exam.id); setSaved(false) }}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                activeExam === exam.id
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {exam.name}
              {count > 0 && (
                <span className="ml-1.5 text-gray-300 tabular-nums">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Objectives for active exam */}
      {activeExam && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400">
            Additional or specific objectives for{' '}
            <span className="font-medium text-gray-600">
              {exams.find(e => e.id === activeExam)?.name}
            </span>.
            These extend the general objectives above.
          </p>

          {getObjectives(activeExam).map((obj, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-300 w-5 shrink-0 text-right">
                {i + 1}.
              </span>
              <input
                type="text"
                value={obj}
                onChange={e => update(activeExam, i, e.target.value)}
                placeholder="Exam-specific objective…"
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-300 outline-none focus:ring-2 focus:ring-gray-900"
              />
              {getObjectives(activeExam).length > 1 && (
                <button
                  onClick={() => remove(activeExam, i)}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between mt-1">
            <button
              onClick={() => add(activeExam)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Plus size={12} />
              Add objective
            </button>

            <div className="flex items-center gap-3">
              {saved && <span className="text-xs text-green-600">Saved</span>}
              <button
                onClick={() => handleSave(activeExam)}
                disabled={saving}
                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}