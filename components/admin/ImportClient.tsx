'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

interface SubtopicJSON {
  external_id: string
  name:        string
  order:       number
}

interface TopicJSON {
  external_id: string
  name:        string
  order:       number
  objectives:  string[]
  subtopics:   SubtopicJSON[]
}

interface SubjectJSON {
  external_id: string
  name:        string
  order:       number
  topics:      TopicJSON[]
}

interface Preview {
  subjects:  number
  topics:    number
  subtopics: number
}

type Step = 'idle' | 'preview' | 'importing' | 'done' | 'error'

export default function ImportClient() {
  const router                    = useRouter()
  const fileRef                   = useRef<HTMLInputElement>(null)
  const [step, setStep]           = useState<Step>('idle')
  const [parsed, setParsed]       = useState<SubjectJSON[]>([])
  const [preview, setPreview]     = useState<Preview | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [results, setResults]     = useState<{
    inserted: number
    updated:  number
    errors:   string[]
  } | null>(null)

  const handleFile = (file: File) => {
    setParseError(null)
    setStep('idle')
    setParsed([])
    setPreview(null)

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (!data.subjects || !Array.isArray(data.subjects)) {
          setParseError('Invalid file — expected a "subjects" array at the root.')
          return
        }

        const subjects: SubjectJSON[] = data.subjects
        let topicCount    = 0
        let subtopicCount = 0

        for (const subject of subjects) {
          topicCount += subject.topics?.length ?? 0
          for (const topic of subject.topics ?? []) {
            subtopicCount += topic.subtopics?.length ?? 0
          }
        }

        setParsed(subjects)
        setPreview({
          subjects:  subjects.length,
          topics:    topicCount,
          subtopics: subtopicCount,
        })
        setStep('preview')
      } catch {
        setParseError('Could not parse file. Make sure it is valid JSON.')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setStep('importing')
    const supabase = createClient()
    let inserted   = 0
    let updated    = 0
    const errors: string[] = []

    for (const subject of parsed) {
      // Upsert subject
      const { data: subjectRow, error: subjectErr } = await supabase
        .from('subjects')
        .upsert(
          { name: subject.name, external_id: subject.external_id },
          { onConflict: 'external_id' }
        )
        .select('id')
        .single()

      if (subjectErr || !subjectRow) {
        errors.push(`Subject "${subject.name}": ${subjectErr?.message}`)
        continue
      }

      inserted++

      for (const topic of subject.topics ?? []) {
        // Upsert topic
        const { data: topicRow, error: topicErr } = await supabase
          .from('topics')
          .upsert(
            {
              external_id: topic.external_id,
              subject_id:  subjectRow.id,
              name:        topic.name,
              topic_order: topic.order,
              objectives:  topic.objectives ?? [],
            },
            { onConflict: 'external_id' }
          )
          .select('id')
          .single()

        if (topicErr || !topicRow) {
          errors.push(`Topic "${topic.name}": ${topicErr?.message}`)
          continue
        }

        inserted++

        for (const subtopic of topic.subtopics ?? []) {
          // Upsert subtopic
          const { error: subtopicErr } = await supabase
            .from('subtopics')
            .upsert(
              {
                external_id:    subtopic.external_id,
                topic_id:       topicRow.id,
                subject_id:     subjectRow.id,
                name:           subtopic.name,
                subtopic_order: subtopic.order,
              },
              { onConflict: 'external_id' }
            )

          if (subtopicErr) {
            errors.push(`Subtopic "${subtopic.name}": ${subtopicErr.message}`)
          } else {
            inserted++
          }
        }
      }
    }

    setResults({ inserted, updated, errors })
    setStep('done')
    if (errors.length === 0) {
      setTimeout(() => router.push('/admin/subjects'), 2000)
    }
  }

  return (
    <div className="max-w-2xl">

      {/* Drop zone */}
      {(step === 'idle' || step === 'preview') && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors mb-6"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <Upload size={20} className="text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium">
            Drop your JSON file here or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Jamsulator curriculum export format
          </p>
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700">{parseError}</p>
        </div>
      )}

      {/* Preview */}
      {step === 'preview' && preview && (
        <div className="border border-gray-200 rounded overflow-hidden mb-6">
          <div className="px-4 py-3 bg-stone-50 border-b border-gray-200">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Preview
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { label: 'Subjects',  value: preview.subjects  },
              { label: 'Topics',    value: preview.topics    },
              { label: 'Subtopics', value: preview.subtopics },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {row.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-stone-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Safe to re-run — existing entries will be updated, not duplicated.
            </p>
            <button
              onClick={handleImport}
              className="text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Import
            </button>
          </div>
        </div>
      )}

      {/* Importing */}
      {step === 'importing' && (
        <div className="border border-gray-200 rounded p-12 text-center">
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium">Importing…</p>
          <p className="text-xs text-gray-400 mt-1">
            This may take a moment for large files.
          </p>
        </div>
      )}

      {/* Done */}
      {step === 'done' && results && (
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-3 bg-stone-50 border-b border-gray-200 flex items-center gap-2">
            <CheckCircle size={13} className="text-green-600" />
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              Import Complete
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-600">Rows processed</span>
              <span className="text-sm font-semibold text-gray-900">
                {results.inserted.toLocaleString()}
              </span>
            </div>
            {results.errors.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-red-500 mb-2">
                  {results.errors.length} errors
                </p>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {results.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400 font-mono">{err}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-stone-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {results.errors.length === 0
                ? 'Redirecting to subjects…'
                : 'Some rows failed. Check errors above.'
              }
            </p>
            <button
              onClick={() => router.push('/admin/subjects')}
              className="text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              View Subjects →
            </button>
          </div>
        </div>
      )}

    </div>
  )
}