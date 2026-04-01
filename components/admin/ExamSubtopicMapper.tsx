'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Subtopic {
  id:   string
  name: string
}

interface Exam {
  id:   string
  name: string
}

interface Props {
  topicId:   string
  subjectId: string
  subtopics: Subtopic[]
}

export default function ExamSubtopicMapper({ topicId, subjectId, subtopics }: Props) {
  const [exams,    setExams]    = useState<Exam[]>([])
  const [mapped,   setMapped]   = useState<Record<string, string[]>>({})  // examId → subtopicId[]
  const [saving,   setSaving]   = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [activeExam, setActiveExam] = useState<string | null>(null)

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

      const { data: mappedData } = await supabase
        .from('exam_subtopics')
        .select('exam_id, subtopic_id')
        .eq('topic_id', topicId)

      if (mappedData) {
        const map: Record<string, string[]> = {}
        for (const row of mappedData) {
          if (!map[row.exam_id]) map[row.exam_id] = []
          map[row.exam_id].push(row.subtopic_id)
        }
        setMapped(map)
      }

      setLoading(false)
    }
    fetch()
  }, [topicId])

  const toggle = async (examId: string, subtopicId: string) => {
    setSaving(`${examId}-${subtopicId}`)
    const supabase  = createClient()
    const current   = mapped[examId] ?? []
    const isOn      = current.includes(subtopicId)

    if (isOn) {
      await supabase
        .from('exam_subtopics')
        .delete()
        .eq('exam_id', examId)
        .eq('subtopic_id', subtopicId)

      setMapped(prev => ({
        ...prev,
        [examId]: (prev[examId] ?? []).filter(id => id !== subtopicId),
      }))
    } else {
      await supabase
        .from('exam_subtopics')
        .upsert({
          exam_id:    examId,
          subtopic_id: subtopicId,
          topic_id:   topicId,
          subject_id: subjectId,
        }, { onConflict: 'exam_id,subtopic_id' })

      setMapped(prev => ({
        ...prev,
        [examId]: [...(prev[examId] ?? []), subtopicId],
      }))
    }

    setSaving(null)
  }

  const toggleAll = async (examId: string) => {
    const current    = mapped[examId] ?? []
    const allOn      = subtopics.every(s => current.includes(s.id))
    const supabase   = createClient()

    if (allOn) {
      await supabase
        .from('exam_subtopics')
        .delete()
        .eq('exam_id', examId)
        .eq('topic_id', topicId)

      setMapped(prev => ({ ...prev, [examId]: [] }))
    } else {
      const rows = subtopics.map(s => ({
        exam_id:     examId,
        subtopic_id: s.id,
        topic_id:    topicId,
        subject_id:  subjectId,
      }))

      await supabase
        .from('exam_subtopics')
        .upsert(rows, { onConflict: 'exam_id,subtopic_id' })

      setMapped(prev => ({ ...prev, [examId]: subtopics.map(s => s.id) }))
    }
  }

  if (loading) return <p className="text-xs text-gray-400">Loading…</p>
  if (exams.length === 0) return <p className="text-xs text-gray-400">No exams configured.</p>
  if (subtopics.length === 0) return <p className="text-xs text-gray-400">No subtopics yet. Add subtopics first.</p>

  return (
    <div className="flex flex-col gap-4">

      {/* Exam tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {exams.map(exam => (
          <button
            key={exam.id}
            onClick={() => setActiveExam(exam.id)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
              activeExam === exam.id
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {exam.name}
            <span className="ml-1.5 text-gray-300 tabular-nums">
              {(mapped[exam.id] ?? []).length}/{subtopics.length}
            </span>
          </button>
        ))}
      </div>

      {/* Subtopic checklist */}
      {activeExam && (
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-2.5 bg-stone-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Tick the subtopics that <span className="font-semibold text-gray-700">
                {exams.find(e => e.id === activeExam)?.name}
              </span> requires
            </p>
            <button
              onClick={() => toggleAll(activeExam)}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              {subtopics.every(s => (mapped[activeExam] ?? []).includes(s.id))
                ? 'Deselect all'
                : 'Select all'
              }
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {subtopics.map(subtopic => {
              const isOn = (mapped[activeExam] ?? []).includes(subtopic.id)
              const busy = saving === `${activeExam}-${subtopic.id}`

              return (
                <label
                  key={subtopic.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <div
                    onClick={() => !busy && toggle(activeExam, subtopic.id)}
                    className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                      isOn
                        ? 'bg-gray-900 border-gray-900'
                        : 'border-gray-300 hover:border-gray-500'
                    } ${busy ? 'opacity-50' : ''}`}
                  >
                    {isOn && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700 leading-snug">
                    {subtopic.name}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}