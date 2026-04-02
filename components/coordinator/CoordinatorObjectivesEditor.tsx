'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

interface Exam      { id: string; name: string }
interface ExamTopic { exam_id: string; objectives: any[]; exams: any }

interface ObjectiveItem {
  objective: string
  examIds:   string[]
}

interface Props {
  topicId:    string
  subjectId:  string
  examTopics: ExamTopic[]
  exams:      Exam[]
}

export default function CoordinatorObjectivesEditor({
  topicId, subjectId, examTopics, exams,
}: Props) {

  const buildInitial = (): ObjectiveItem[] => {
    const map = new Map<string, string[]>()
    for (const et of examTopics) {
      for (const obj of et.objectives ?? []) {
        const text = typeof obj === 'string' ? obj : obj.text
        if (!map.has(text)) map.set(text, [])
        map.get(text)!.push(et.exam_id)
      }
    }
    return Array.from(map.entries()).map(([objective, examIds]) => ({
      objective,
      examIds,
    }))
  }

  const [items,  setItems]  = useState<ObjectiveItem[]>(buildInitial)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const add = () => {
    setItems(prev => [...prev, {
      objective: '',
      examIds:   exams.map(e => e.id),
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

  const remove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const byExam: Record<string, string[]> = {}
    for (const exam of exams) byExam[exam.id] = []

    for (const item of items) {
      if (!item.objective.trim()) continue
      for (const examId of item.examIds) {
        if (!byExam[examId]) byExam[examId] = []
        byExam[examId].push(item.objective.trim())
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
          className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-2"
        >
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

          <div className="flex items-center gap-3 pl-7">
            <span className="text-xs text-gray-400 shrink-0">Applies to:</span>
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