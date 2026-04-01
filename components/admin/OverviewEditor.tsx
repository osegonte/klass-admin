'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  table:        'topics' | 'subtopics'
  id:           string
  initialValue: string
}

export default function OverviewEditor({ table, id, initialValue }: Props) {
  const [value,   setValue]   = useState(initialValue)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from(table).update({ overview: value }).eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        rows={3}
        value={value}
        onChange={e => { setValue(e.target.value); setSaved(false) }}
        placeholder="Write a broad overview of what this topic covers..."
        className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:ring-2 focus:ring-gray-900 resize-none leading-relaxed"
      />
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-xs text-green-600">Saved</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || value === initialValue}
          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}