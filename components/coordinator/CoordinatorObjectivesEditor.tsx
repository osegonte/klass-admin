'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

interface Exam      { id: string; name: string }
interface Subtopic  { id: string; name: string; subtopic_order: number }
interface ExamTopic { exam_id: string; objectives: any[]; exams: any }

interface ObjectiveItem {
  objective:   string
  examIds:     string[]
  subtopicIds: string[]
}

interface Props {
  topicId:    string
  subjectId:  string
  examTopics: ExamTopic[]
  exams:      Exam[]
  subtopics:  Subtopic[]
}

export default function CoordinatorObjectivesEditor({
  topicId, subjectId, examTopics, exams, subtopics,
}: Props) {

  const buildInitial = (): ObjectiveItem[] => {
    const map = new Map<string, ObjectiveItem>()
    for (const et of examTopics) {
      for (const obj of et.objectives ?? []) {
        // Handle both old string[] format and new { text, subtopic_ids }[] format
        const text        = typeof obj === 'string' ? obj : obj.text
        const subtopicIds = typeof obj === 'string' ? [] : (obj.subtopic_ids ?? [])
        if (!map.has(text)) {
          map.set(text, { objective: text, examIds: [], subtopicIds })
        }
        map.get(text)!.examIds.push(et.exam_id)
      }
    }
    return Array.from(map.values())
  }

  const [items,  setItems]  = useState<ObjectiveItem[]>(buildInitial)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const add = () => {
    setItems(prev => [...prev, {
      objective:   '',
      examIds:     exams.map(e => e.id),
      subtopicIds: [],
    }])
    setSaved(false)
  }

  const updateText = (index: number, value: string) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, objective: value } : item
    ))
    setSaved(false)
  }

  const toggleExam = (index: number, examId: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const has = item.examIds.includes(examId)
      return {
        ...item,
        examIds: has
          ? item.examIds.filter(id => id !== examId)
          : [...item.examIds, examId],
      }
    }))
    setSaved(false)
  }

  const toggleSubtopic = (index: number, subtopicId: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const has = item.subtopicIds.includes(subtopicId)
      return {
        ...item,
        subtopicIds: has
          ? item.subtopicIds.filter(id => id !== subtopicId)
          : [...item.subtopicIds, subtopicId],
      }
    }))
    setSaved(false)
  }

  const toggleAllSubtopics = (index: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const allOn = subtopics.every(s => item.subtopicIds.includes(s.id))
      return {
        ...item,
        subtopicIds: allOn ? [] : subtopics.map(s => s.id),
      }
    }))
    setSaved(false)
  }

  const remove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    // Group by exam, store as { text, subtopic_ids }[]
    const byExam: Record<string, any[]> = {}
    for (const exam of exams) byExam[exam.id] = []

    for (const item of items) {
      if (!item.objective.trim()) continue
      for (const examId of item.examIds) {
        if (!byExam[examId]) byExam[examId] = []
        byExam[examId].push({
          text:        item.objective.trim(),
          subtopic_ids: item.subtopicIds,
        })
      }
    }

    for (const [examId, objectives] of Object.entries(byExam)) {
      await supabase
        .from('exam_topics')
        .upsert({
          exam_id:    examId,
          topic_id:   topicId,
          subject_id: subjectId,
          objectives,
        }, { onConflict: 'exam_id,topic_id' })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3">

      {items.length === 0 && (
        <p className="text-xs text-gray-400 italic">
          No objectives yet. Add the first one below.
        </p>
      )}

      {items.map((item, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-3"
        >
          {/* Objective text */}
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-300 w-5 shrink-0 text-right mt-2.5">
              {i + 1}.
            </span>
            <input
              type="text"
              value={item.objective}
              onChange={e => updateText(i, e.target.value)}
              placeholder="Students should be able to…"
              className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-300 outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={() => remove(i)}
              className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-2"
            >
              <X size={13} />
            </button>
          </div>

          {/* Exam tags */}
          <div className="flex items-center gap-3 pl-7">
            <span className="text-xs text-gray-400 shrink-0">Exam:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {exams.map(exam => {
                const checked = item.examIds.includes(exam.id)
                return (
                  <button
                    key={exam.id}
                    onClick={() => toggleExam(i, exam.id)}
                    className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${
                      checked
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {exam.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subtopic mapping */}
          {subtopics.length > 0 && (
            <div className="pl-7 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Subtopics covered:</span>
                <button
                  onClick={() => toggleAllSubtopics(i)}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {subtopics.every(s => item.subtopicIds.includes(s.id))
                    ? 'Clear all'
                    : 'Select all'
                  }
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {subtopics
                  .sort((a, b) => a.subtopic_order - b.subtopic_order)
                  .map(subtopic => {
                    const checked = item.subtopicIds.includes(subtopic.id)
                    return (
                      <label
                        key={subtopic.id}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <div
                          onClick={() => toggleSubtopic(i, subtopic.id)}
                          className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                            checked
                              ? 'bg-gray-900 border-gray-900'
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {checked && (
                            <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs leading-snug ${checked ? 'text-gray-800' : 'text-gray-400'}`}>
                          {subtopic.name}
                        </span>
                      </label>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center justify-between">
        <button
          onClick={add}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <Plus size={12} />
          Add objective
        </button>

        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-600">Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save objectives'}
          </button>
        </div>
      </div>
    </div>
  )
}