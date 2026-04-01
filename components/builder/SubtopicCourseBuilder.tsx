'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import BlockEditor from './BlockEditor'
import FlashcardEditor from './FlashcardEditor'
import CoursePreview from './CoursePreview'
import SubmitButton from './SubmitButton'
import { Loader2 } from 'lucide-react'

interface Block {
  id:              string
  type:            string
  title:           string
  body:            string
  analogy?:        string
  breakdown?:      string
  diagram_prompt?: string
  steps?:          any[]
  block_order:     number
}

interface Flashcard {
  id:         string
  front:      string
  back:       string
  card_order: number
}

interface Props {
  assignmentId:     string
  subtopicId:       string
  submissionStatus: string | null
}

type Tab = 'build' | 'preview'

export default function SubtopicCourseBuilder({
  assignmentId, subtopicId, submissionStatus,
}: Props) {
  const [tab,        setTab]        = useState<Tab>('build')
  const [blocks,     setBlocks]     = useState<Block[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const isReadOnly = submissionStatus === 'approved' || submissionStatus === 'submitted'

  const fetchContent = useCallback(async () => {
    const supabase = createClient()
    const [{ data: blocksData }, { data: flashcardsData }] = await Promise.all([
      supabase.from('content_blocks').select('*').eq('subtopic_id', subtopicId).order('block_order'),
      supabase.from('flashcards').select('*').eq('subtopic_id', subtopicId).order('card_order'),
    ])
    setBlocks(blocksData ?? [])
    setFlashcards(flashcardsData ?? [])
    setLoading(false)
  }, [subtopicId])

  useEffect(() => { fetchContent() }, [fetchContent])

  const showSaved = () => {
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const addBlock = async (type: string, afterOrder: number) => {
    const supabase = createClient()
    const newOrder = afterOrder + 1
    const id       = crypto.randomUUID()

    const toShift = blocks.filter(b => b.block_order >= newOrder)
    for (const b of toShift) {
      await supabase.from('content_blocks').update({ block_order: b.block_order + 1 }).eq('id', b.id)
    }

    await supabase.from('content_blocks').insert({
      id, subtopic_id: subtopicId, type, title: '', body: '', block_order: newOrder,
    })

    await fetchContent()
    showSaved()
  }

  const updateBlock = async (updated: Block) => {
    setSaveStatus('saving')
    const supabase = createClient()
    await supabase.from('content_blocks').update({
      type:           updated.type,
      title:          updated.title,
      body:           updated.body,
      analogy:        updated.analogy        ?? null,
      breakdown:      updated.breakdown      ?? null,
      diagram_prompt: updated.diagram_prompt ?? null,
      steps:          updated.steps          ?? null,
    }).eq('id', updated.id)
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b))
    showSaved()
  }

  const deleteBlock = async (id: string) => {
    const supabase = createClient()
    await supabase.from('content_blocks').delete().eq('id', id)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  const addFlashcard = async () => {
    const supabase = createClient()
    const id       = crypto.randomUUID()
    const order    = flashcards.length
    await supabase.from('flashcards').insert({
      id, subtopic_id: subtopicId, front: '', back: '', card_order: order,
    })
    setFlashcards(prev => [...prev, { id, front: '', back: '', card_order: order }])
  }

  const updateFlashcard = async (updated: Flashcard) => {
    setSaveStatus('saving')
    const supabase = createClient()
    await supabase.from('flashcards').update({ front: updated.front, back: updated.back }).eq('id', updated.id)
    setFlashcards(prev => prev.map(f => f.id === updated.id ? updated : f))
    showSaved()
  }

  const deleteFlashcard = async (id: string) => {
    const supabase = createClient()
    await supabase.from('flashcards').delete().eq('id', id)
    setFlashcards(prev => prev.filter(f => f.id !== id))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={18} className="animate-spin text-gray-400" />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(['build', 'preview'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium rounded transition-colors capitalize ${
                tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600">Saved</span>
          )}
          {!isReadOnly && (
            <SubmitButton
              assignmentId={assignmentId}
              blockCount={blocks.length}
              flashcardCount={flashcards.length}
              isTopicLevel={false}
              subtopicId={subtopicId}
            />
          )}
        </div>
      </div>

      {tab === 'build' && (
        <div className="flex flex-col gap-6">
          <BlockEditor
            blocks={blocks}
            onAdd={addBlock}
            onUpdate={updateBlock}
            onDelete={deleteBlock}
            readOnly={isReadOnly}
          />
          <FlashcardEditor
            flashcards={flashcards}
            onAdd={addFlashcard}
            onUpdate={updateFlashcard}
            onDelete={deleteFlashcard}
            readOnly={isReadOnly}
          />
        </div>
      )}

      {tab === 'preview' && (
        <CoursePreview blocks={blocks} flashcards={flashcards} />
      )}

    </div>
  )
}
