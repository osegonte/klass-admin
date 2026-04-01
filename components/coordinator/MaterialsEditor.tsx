'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Materials {
  textbook?:       string
  transcript?:     string
  past_questions?: string
  extra?:          string
}

interface Props {
  topicId:      string
  initialValue: Materials
}

const SECTIONS = [
  {
    key:         'textbook'       as keyof Materials,
    label:       'Textbook',
    description: 'Relevant textbook pages and excerpts for this topic.',
    placeholder: 'Paste textbook content here…',
  },
  {
    key:         'transcript'     as keyof Materials,
    label:       'YouTube Transcript',
    description: 'Transcript from a relevant YouTube video or lecture.',
    placeholder: 'Paste transcript here…',
  },
  {
    key:         'past_questions' as keyof Materials,
    label:       'Past Questions',
    description: 'Example past exam questions related to this topic.',
    placeholder: 'Paste past questions here…',
  },
  {
    key:         'extra'          as keyof Materials,
    label:       'Extra Notes',
    description: 'Any other reference material, notes or context.',
    placeholder: 'Paste extra notes here…',
  },
]

export default function MaterialsEditor({ topicId, initialValue }: Props) {
  const empty: Materials = {
    textbook:       '',
    transcript:     '',
    past_questions: '',
    extra:          '',
  }

  // Merge initialValue safely — handles null, empty object, partial object
  const [materials, setMaterials] = useState<Materials>({
    ...empty,
    ...(typeof initialValue === 'object' && initialValue !== null ? initialValue : {}),
  })

  const [open,    setOpen]    = useState<Record<string, boolean>>({ textbook: true })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  const update = (key: keyof Materials, value: string) => {
    setMaterials(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const toggle = (key: string) => {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('topics')
      .update({ materials })
      .eq('id', topicId)

    if (error) {
      console.error('Materials save error:', error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const filledCount = SECTIONS.filter(s => materials[s.key]?.trim()).length

  return (
    <div className="flex flex-col gap-2">
      {SECTIONS.map(section => {
        const isOpen   = !!open[section.key]
        const hasValue = !!materials[section.key]?.trim()

        return (
          <div
            key={section.key}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              onClick={() => toggle(section.key)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-widest uppercase text-gray-700">
                  {section.label}
                </span>
                {hasValue && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                )}
              </div>
              {isOpen
                ? <ChevronUp size={13} className="text-gray-400" />
                : <ChevronDown size={13} className="text-gray-400" />
              }
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 p-4 flex flex-col gap-2">
                <p className="text-xs text-gray-400">{section.description}</p>
                <textarea
                  rows={8}
                  value={materials[section.key] ?? ''}
                  onChange={e => update(section.key, e.target.value)}
                  placeholder={section.placeholder}
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm font-mono text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-gray-900 resize-none leading-relaxed"
                />
              </div>
            )}
          </div>
        )
      })}

      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-400">
          {filledCount} of {SECTIONS.length} sections filled
        </p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-600">Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save materials'}
          </button>
        </div>
      </div>
    </div>
  )
}