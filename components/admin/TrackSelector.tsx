'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Track {
  id: string
  name: string
}

interface Props {
  subjectId: string
  tracks: Track[]
  assignedTrackIds: string[]
}

export default function TrackSelector({ subjectId, tracks, assignedTrackIds }: Props) {
  const router = useRouter()
  const [assigned, setAssigned] = useState<string[]>(assignedTrackIds)
  const [saving, setSaving]     = useState<string | null>(null)

  const toggle = async (trackId: string) => {
    setSaving(trackId)
    const supabase  = createClient()
    const isOn      = assigned.includes(trackId)

    if (isOn) {
      await supabase
        .from('subject_tracks')
        .delete()
        .eq('subject_id', subjectId)
        .eq('track_id', trackId)
      setAssigned(prev => prev.filter(id => id !== trackId))
    } else {
      await supabase
        .from('subject_tracks')
        .insert({ subject_id: subjectId, track_id: trackId })
      setAssigned(prev => [...prev, trackId])
    }

    setSaving(null)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {tracks.map(track => {
        const active = assigned.includes(track.id)
        const busy   = saving === track.id
        return (
          <button
            key={track.id}
            onClick={() => toggle(track.id)}
            disabled={busy}
            className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors disabled:opacity-50 ${
              active
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {busy ? '…' : track.name}
          </button>
        )
      })}
    </div>
  )
}