'use client'

import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'

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

interface Props {
  blocks:   Block[]
  onAdd:    (type: string, afterOrder: number) => Promise<void>
  onUpdate: (block: Block) => Promise<void>
  onDelete: (id: string) => Promise<void>
  readOnly: boolean
}

const BLOCK_TYPES = [
  { type: 'definition',  label: 'Definition',  color: 'text-purple-600' },
  { type: 'explanation', label: 'Explanation', color: 'text-blue-600'   },
  { type: 'formula',     label: 'Formula',     color: 'text-amber-700'  },
  { type: 'example',     label: 'Example',     color: 'text-green-700'  },
  { type: 'keypoint',    label: 'Key Point',   color: 'text-yellow-700' },
  { type: 'note',        label: 'Note',        color: 'text-gray-500'   },
  { type: 'diagram',     label: 'Diagram',     color: 'text-teal-700'   },
  { type: 'table',       label: 'Table',       color: 'text-slate-600'  },
]

const BLOCK_BG: Record<string, string> = {
  definition:  'bg-purple-50',
  explanation: 'bg-blue-50',
  formula:     'bg-amber-50',
  example:     'bg-green-50',
  keypoint:    'bg-yellow-50',
  note:        'bg-stone-50',
  diagram:     'bg-teal-50',
  table:       'bg-slate-50',
}

const BLOCK_COLOR: Record<string, string> = {
  definition:  'text-purple-600',
  explanation: 'text-blue-600',
  formula:     'text-amber-700',
  example:     'text-green-700',
  keypoint:    'text-yellow-700',
  note:        'text-gray-500',
  diagram:     'text-teal-700',
  table:       'text-slate-600',
}

const input = "w-full text-sm text-gray-900 placeholder-gray-300 border border-gray-200 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900 bg-white"
const ta    = `${input} resize-none`

function AddBlockButton({
  afterOrder,
  onAdd,
}: {
  afterOrder: number
  onAdd:      (type: string, afterOrder: number) => Promise<void>
}) {
  const [open,   setOpen]   = useState(false)
  const [adding, setAdding] = useState(false)

  const handle = async (type: string) => {
    setAdding(true)
    setOpen(false)
    await onAdd(type, afterOrder)
    setAdding(false)
  }

  return (
    <div className="relative flex items-center justify-center my-1 group">
      <div className="absolute inset-x-0 h-px bg-gray-100 group-hover:bg-gray-200 transition-colors" />
      <button
        onClick={() => setOpen(v => !v)}
        disabled={adding}
        className="relative z-10 flex items-center gap-1 text-xs text-gray-300 hover:text-gray-600 bg-white border border-gray-200 hover:border-gray-400 px-2.5 py-1 rounded-full transition-colors"
      >
        <Plus size={11} />
        {adding ? 'Adding…' : 'Add block'}
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2 grid grid-cols-2 gap-1 w-64">
          {BLOCK_TYPES.map(bt => (
            <button
              key={bt.type}
              onClick={() => handle(bt.type)}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-stone-50 text-left transition-colors"
            >
              <span className={`text-xs font-semibold ${bt.color}`}>
                {bt.label}
              </span>
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="col-span-2 text-xs text-gray-400 hover:text-gray-600 py-1 text-center border-t border-gray-100 mt-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function BlockCard({
  block, onUpdate, onDelete, readOnly,
}: {
  block:    Block
  onUpdate: (b: Block) => Promise<void>
  onDelete: (id: string) => Promise<void>
  readOnly: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)

  const update = (fields: Partial<Block>) => onUpdate({ ...block, ...fields })

  const addStep = () => {
    const steps = [...(block.steps ?? []), {
      id: crypto.randomUUID(), expression: '', talkingPoint: '',
    }]
    update({ steps })
  }

  const updateStep = (id: string, field: string, value: string) =>
    update({ steps: (block.steps ?? []).map(s => s.id === id ? { ...s, [field]: value } : s) })

  const removeStep = (id: string) =>
    update({ steps: (block.steps ?? []).filter((s: any) => s.id !== id) })

  const bg    = BLOCK_BG[block.type]    ?? 'bg-stone-50'
  const color = BLOCK_COLOR[block.type] ?? 'text-gray-500'
  const label = BLOCK_TYPES.find(b => b.type === block.type)?.label ?? block.type

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${bg}`}>
        <span className={`text-xs font-semibold uppercase tracking-widest shrink-0 ${color}`}>
          {label}
        </span>
        <span className="flex-1 text-xs text-gray-400 truncate">
          {block.title || block.body || 'Empty block'}
        </span>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
        {!readOnly && (
          <button
            onClick={() => onDelete(block.id)}
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Fields */}
      {!collapsed && !readOnly && (
        <div className="p-4 flex flex-col gap-3">

          {block.type === 'definition' && (<>
            <input className={input} placeholder="Term or concept…" value={block.title} onChange={e => update({ title: e.target.value })} />
            <textarea className={ta} rows={3} placeholder="Clear, precise definition…" value={block.body} onChange={e => update({ body: e.target.value })} />
            <textarea className={ta} rows={2} placeholder="Analogy (optional)…" value={block.analogy ?? ''} onChange={e => update({ analogy: e.target.value })} />
          </>)}

          {block.type === 'explanation' && (<>
            <input className={input} placeholder="Title for this explanation…" value={block.title} onChange={e => update({ title: e.target.value })} />
            <textarea className={ta} rows={4} placeholder="Explain with context and analogy…" value={block.body} onChange={e => update({ body: e.target.value })} />
          </>)}

          {block.type === 'formula' && (<>
            <input className={input} placeholder="Formula name…" value={block.title} onChange={e => update({ title: e.target.value })} />
            <textarea className={`${ta} font-mono text-xs`} rows={2} placeholder="e.g. a^m × a^n = a^(m+n)" value={block.body} onChange={e => update({ body: e.target.value })} />
            <textarea className={ta} rows={2} placeholder="Break down each variable…" value={block.breakdown ?? ''} onChange={e => update({ breakdown: e.target.value })} />
          </>)}

          {block.type === 'example' && (<>
            <input className={input} placeholder="Example title or problem…" value={block.title} onChange={e => update({ title: e.target.value })} />
            <div className="flex flex-col gap-2">
              {(block.steps ?? []).map((step: any, i: number) => (
                <div key={step.id} className="border border-gray-200 rounded p-3 flex flex-col gap-2 bg-stone-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Step {i + 1}</span>
                    <button onClick={() => removeStep(step.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                  <input className={input} placeholder="Expression or equation…" value={step.expression} onChange={e => updateStep(step.id, 'expression', e.target.value)} />
                  <input className={input} placeholder="Explain what's happening…" value={step.talkingPoint} onChange={e => updateStep(step.id, 'talkingPoint', e.target.value)} />
                </div>
              ))}
              <button onClick={addStep} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors py-1">
                <Plus size={12} /> Add Step
              </button>
            </div>
          </>)}

          {block.type === 'keypoint' && (
            <textarea className={ta} rows={3} placeholder="The single most important thing to remember…" value={block.body} onChange={e => update({ body: e.target.value })} />
          )}

          {block.type === 'note' && (
            <textarea className={ta} rows={3} placeholder="Extra context, warnings, or exam traps…" value={block.body} onChange={e => update({ body: e.target.value })} />
          )}

          {block.type === 'diagram' && (<>
            <input className={input} placeholder="Diagram title…" value={block.title} onChange={e => update({ title: e.target.value })} />
            <textarea className={ta} rows={2} placeholder="What this diagram shows…" value={block.body} onChange={e => update({ body: e.target.value })} />
            <textarea className={ta} rows={3} placeholder="Drawing instructions…" value={block.diagram_prompt ?? ''} onChange={e => update({ diagram_prompt: e.target.value })} />
          </>)}

          {block.type === 'table' && (<>
            <input className={input} placeholder="Table title…" value={block.title} onChange={e => update({ title: e.target.value })} />
            <textarea
              className={`${ta} font-mono text-xs`}
              rows={6}
              placeholder={`Headers: Col1 | Col2 | Col3\nRow: val1 | val2 | val3`}
              value={block.body}
              onChange={e => update({ body: e.target.value })}
            />
            <p className="text-xs text-gray-400">Use pipe | to separate columns. First line = headers.</p>
          </>)}

        </div>
      )}

      {/* Read only view */}
      {!collapsed && readOnly && (
        <div className="p-4">
          {block.title && <p className="text-sm font-medium text-gray-900 mb-1">{block.title}</p>}
          {block.body  && <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{block.body}</p>}
        </div>
      )}
    </div>
  )
}

export default function BlockEditor({ blocks, onAdd, onUpdate, onDelete, readOnly }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
          Content Blocks
        </h2>
        <span className="text-xs text-gray-400">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
      </div>

      {blocks.length === 0 && !readOnly && (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center mb-2">
          <p className="text-sm text-gray-400 mb-1">No blocks yet.</p>
          <p className="text-xs text-gray-400 mb-4">
            Start building the course by adding your first block.
          </p>
          <AddBlockButton afterOrder={-1} onAdd={onAdd} />
        </div>
      )}

      {blocks.length === 0 && readOnly && (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-400">No content blocks yet.</p>
        </div>
      )}

      <div className="flex flex-col">
        {!readOnly && blocks.length > 0 && (
          <AddBlockButton afterOrder={-1} onAdd={onAdd} />
        )}
        {blocks.map((block) => (
          <div key={block.id}>
            <BlockCard
              block={block}
              onUpdate={onUpdate}
              onDelete={onDelete}
              readOnly={readOnly}
            />
            {!readOnly && (
              <AddBlockButton afterOrder={block.block_order} onAdd={onAdd} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
