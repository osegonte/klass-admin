'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Materials {
  textbook?:       string
  transcript?:     string
  past_questions?: string
  extra?:          string
}

const SECTIONS = [
  { key: 'textbook',       label: 'Textbook'       },
  { key: 'transcript',     label: 'Transcript'     },
  { key: 'past_questions', label: 'Past Questions' },
  { key: 'extra',          label: 'Extra Notes'    },
]

interface Props {
  materials: Materials
}

export default function MaterialsPanel({ materials }: Props) {
  const [open, setOpen] = useState(false)

  const filled = SECTIONS.filter(s => materials[s.key as keyof Materials]?.trim())
  if (filled.length === 0) return null

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-700">
            Materials
          </span>
          <span className="text-xs text-gray-400">
            {filled.length} section{filled.length !== 1 ? 's' : ''} provided
          </span>
        </div>
        {open
          ? <ChevronUp size={13} className="text-gray-400" />
          : <ChevronDown size={13} className="text-gray-400" />
        }
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {filled.map(section => (
            <div key={section.key} className="p-4">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">
                {section.label}
              </p>
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono bg-stone-50 rounded p-3 max-h-64 overflow-y-auto">
                {materials[section.key as keyof Materials]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
