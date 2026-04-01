'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

type ItemType = 'subject' | 'topic' | 'subtopic'

interface Props {
  type:       ItemType
  subjectId?: string
  topicId?:   string
}

const CONFIG = {
  subject:  { label: 'Subject',  placeholder: 'e.g. Mathematics'  },
  topic:    { label: 'Topic',    placeholder: 'e.g. Cell Biology'  },
  subtopic: { label: 'Subtopic', placeholder: 'e.g. Cell Division' },
}

export default function NewItemButton({ type, subjectId, topicId }: Props) {
  const router              = useRouter()
  const [open, setOpen]     = useState(false)
  const [name, setName]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const config = CONFIG[type]

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    let insertError = null

    if (type === 'subject') {
      const { error } = await supabase
        .from('subjects')
        .insert({ name: name.trim() })
      insertError = error

    } else if (type === 'topic' && subjectId) {
      const { data: existing } = await supabase
        .from('topics')
        .select('topic_order')
        .eq('subject_id', subjectId)
        .order('topic_order', { ascending: false })
        .limit(1)

      const nextOrder = existing?.length ? existing[0].topic_order + 1 : 0

      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id:  subjectId,
          name:        name.trim(),
          topic_order: nextOrder,
        })
      insertError = error

    } else if (type === 'subtopic' && topicId && subjectId) {
      const { data: existing } = await supabase
        .from('subtopics')
        .select('subtopic_order')
        .eq('topic_id', topicId)
        .order('subtopic_order', { ascending: false })
        .limit(1)

      const nextOrder = existing?.length ? existing[0].subtopic_order + 1 : 0

      const { error } = await supabase
        .from('subtopics')
        .insert({
          topic_id:       topicId,
          subject_id:     subjectId,
          name:           name.trim(),
          subtopic_order: nextOrder,
        })
      insertError = error
    }

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setOpen(false)
    setName('')
    setSaving(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-2 rounded hover:bg-gray-700 transition-colors"
      >
        <Plus size={12} />
        New {config.label}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-md shadow-xl">

            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-900 mb-4">
              New {config.label}
            </h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Name
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder={config.placeholder}
                className="border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-3">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setOpen(false); setName(''); setError(null) }}
                className="text-xs text-gray-500 px-3 py-2 rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Saving…' : `Create ${config.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}