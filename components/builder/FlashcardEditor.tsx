'use client'

import { Plus, Trash2 } from 'lucide-react'

interface Flashcard {
  id:         string
  front:      string
  back:       string
  card_order: number
}

interface Props {
  flashcards: Flashcard[]
  onAdd:      () => Promise<void>
  onUpdate:   (card: Flashcard) => Promise<void>
  onDelete:   (id: string) => Promise<void>
  readOnly:   boolean
}

const ta = "w-full text-sm text-gray-900 placeholder-gray-300 border border-gray-200 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900 resize-none bg-white"

export default function FlashcardEditor({
  flashcards, onAdd, onUpdate, onDelete, readOnly,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
          Flashcards
        </h2>
        {!readOnly && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
          >
            <Plus size={11} />
            Add Card
          </button>
        )}
      </div>

      {flashcards.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-400">No flashcards yet.</p>
          {!readOnly && (
            <p className="text-xs text-gray-400 mt-1">
              Add front/back revision cards for key concepts.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {flashcards.map((card, index) => (
          <div key={card.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Card {index + 1}
              </span>
              {!readOnly && (
                <button
                  onClick={() => onDelete(card.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              <div className="p-4 flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Front</label>
                <textarea
                  className={ta}
                  rows={3}
                  placeholder="Term, concept, or question…"
                  value={card.front}
                  onChange={e => onUpdate({ ...card, front: e.target.value })}
                  readOnly={readOnly}
                />
              </div>
              <div className="p-4 flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Back</label>
                <textarea
                  className={ta}
                  rows={3}
                  placeholder="Definition, answer, or explanation…"
                  value={card.back}
                  onChange={e => onUpdate({ ...card, back: e.target.value })}
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
