'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

interface Materials {
  textbook?:       string
  transcript?:     string
  past_questions?: string
  extra?:          string
}

interface Objective {
  text:     string
  examName: string
}

interface Props {
  topicId:      string
  initialValue: Materials
  topicName:    string
  subjectName:  string
  examNames:    string[]
  objectives:   Objective[]
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

function buildPrompt(
  topicName:    string,
  subjectName:  string,
  examNames:    string[],
  objectives:   Objective[],
  materials:    Materials,
  batch:        1 | 2 | null,
): string {
  const examContext = examNames.length > 0
    ? examNames.join(' and ')
    : 'Nigerian secondary school'

  const isWAEC = examNames.some(e => e.toLowerCase().includes('waec'))
  const isJAMB = examNames.some(e => e.toLowerCase().includes('jamb'))

  const examStyle = isWAEC && isJAMB
    ? 'Both WAEC (essay and structured questions) and JAMB (multiple choice) exam styles apply.'
    : isWAEC
    ? 'WAEC exam style applies — include both essay and structured questions.'
    : isJAMB
    ? 'JAMB exam style applies — multiple choice questions only.'
    : 'Nigerian secondary school exam style applies.'

  const objectiveLines = objectives.length > 0
    ? objectives.map((o, i) => `${i + 1}. ${o.text}${o.examName ? ` [${o.examName}]` : ''}`).join('\n')
    : 'No objectives set yet.'

  const hasTextbook      = !!materials.textbook?.trim()
  const hasTranscript    = !!materials.transcript?.trim()
  const hasPastQuestions = !!materials.past_questions?.trim()
  const hasExtra         = !!materials.extra?.trim()

  const batchNote = batch === 1
    ? '\n\n⚠️ THIS IS BATCH 1 OF 2. Read and absorb this context only. Do NOT produce any output yet. Wait for Batch 2 before responding.\n'
    : batch === 2
    ? '\n\n⚠️ THIS IS BATCH 2 OF 2. You now have all the context. Produce the full output as instructed below.\n'
    : ''

  const sections: string[] = []

  sections.push(`# KLASS Studio — Materials Research Request
## Topic: ${topicName}
## Subject: ${subjectName}
## Exam Context: ${examContext}
## ${examStyle}

### Learning Objectives
These are what students must be able to do after studying this topic:
${objectiveLines}

### Rules
- Stay strictly within the scope of the objectives above
- Do not introduce concepts beyond what the objectives require
- All content must be accurate for Nigerian secondary school level
- Use clear, simple language appropriate for SS1–SS3 students
- Do not plagiarise — synthesise from your training knowledge${batchNote}`)

  // TEXTBOOK section
  if (!hasTextbook) {
    sections.push(`---
## SECTION 1: TEXTBOOK NOTES

Write comprehensive textbook-style notes for "${topicName}" covering all the objectives listed above.

Format:
- Use markdown headings (##, ###)
- Write in flowing prose — not bullet points
- Cover every objective systematically
- Include definitions, explanations, and examples
- End with a summary paragraph

Output the textbook notes in a markdown code block.`)
  } else {
    sections.push(`---
## SECTION 1: TEXTBOOK NOTES
✅ Already provided. No action needed for this section.`)
  }

  // TRANSCRIPT section
  if (!hasTranscript) {
    sections.push(`---
## SECTION 2: YOUTUBE VIDEO RECOMMENDATIONS

Search your knowledge for YouTube videos that teach "${topicName}" at Nigerian secondary school level (${examContext}).

For each video provide:
- Title
- Channel name
- URL (if known, otherwise say "Search YouTube for: [search query]")
- Why it is relevant to these objectives
- Which objectives it covers

List 3 to 5 videos. Prioritise Nigerian teachers and African educational channels where possible.

Note: The coordinator will watch these videos and paste the transcripts manually. You are only recommending here.`)
  } else {
    sections.push(`---
## SECTION 2: YOUTUBE TRANSCRIPT
✅ Already provided. No action needed for this section.`)
  }

  // PAST QUESTIONS section
  if (!hasPastQuestions) {
    sections.push(`---
## SECTION 3: PAST EXAM QUESTIONS

Generate exam questions for "${topicName}" modelled on real ${examContext} exam patterns.

${isWAEC ? `For WAEC:
- 2 essay questions (10 marks each)
- 3 structured questions (5 marks each)
- Label each question with the objective it tests` : ''}

${isJAMB ? `For JAMB:
- 10 multiple choice questions (A, B, C, D)
- Mark the correct answer with an asterisk (*)
- Include a brief explanation for why the correct answer is right
- Label each question with the objective it tests` : ''}

${!isWAEC && !isJAMB ? `Generate:
- 5 multiple choice questions (A, B, C, D) with answers marked
- 3 short answer questions with model answers` : ''}

Do not make up obscure facts. Base all questions on the objectives above.`)
  } else {
    sections.push(`---
## SECTION 3: PAST QUESTIONS
✅ Already provided. No action needed for this section.`)
  }

  // EXTRA NOTES section
  if (!hasExtra) {
    sections.push(`---
## SECTION 4: EXTRA NOTES

Write concise exam-focused notes for "${topicName}". This section is for what students need to score marks, not just understand.

Include:
- Common exam traps and misconceptions students fall into
- Key distinctions examiners test (e.g. "students confuse X with Y")
- Mnemonics or memory aids for lists and sequences
- Keywords and phrases that score marks in WAEC answers
- Any facts that appear repeatedly in past exams

Keep this section short and punchy — bullet points are fine here.`)
  } else {
    sections.push(`---
## SECTION 4: EXTRA NOTES
✅ Already provided. No action needed for this section.`)
  }

  return sections.join('\n\n')
}

export default function MaterialsEditor({
  topicId,
  initialValue,
  topicName,
  subjectName,
  examNames,
  objectives,
}: Props) {
  const empty: Materials = {
    textbook:       '',
    transcript:     '',
    past_questions: '',
    extra:          '',
  }

  const [materials, setMaterials] = useState<Materials>({
    ...empty,
    ...(typeof initialValue === 'object' && initialValue !== null ? initialValue : {}),
  })

  const [open,    setOpen]    = useState<Record<string, boolean>>({ textbook: true })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [copied,  setCopied]  = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)

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
    if (error) { console.error('Materials save error:', error.message); setSaving(false); return }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const needsBatch = objectives.length > 5

  const handleCopyPrompt = () => {
    if (needsBatch) {
      setShowBatchModal(true)
    } else {
      const prompt = buildPrompt(topicName, subjectName, examNames, objectives, materials, null)
      navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyBatch = (batch: 1 | 2) => {
    const prompt = buildPrompt(topicName, subjectName, examNames, objectives, materials, batch)
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded hover:border-gray-400 transition-colors"
          >
            {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
            {copied ? 'Copied' : needsBatch ? 'Copy prompt (batched)' : 'Copy prompt'}
          </button>
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

      {/* Batch modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-900 mb-1">
              Batched Prompt
            </h2>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              This topic has {objectives.length} objectives — too large for one prompt. Copy Batch 1 first, paste into ChatGPT, wait for it to acknowledge. Then copy Batch 2 and paste in the same chat.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCopyBatch(1)}
                className="w-full flex items-center justify-between text-xs bg-gray-900 text-white px-4 py-3 rounded hover:bg-gray-700 transition-colors"
              >
                <span>Copy Batch 1 — Context</span>
                <Copy size={11} />
              </button>
              <button
                onClick={() => handleCopyBatch(2)}
                className="w-full flex items-center justify-between text-xs border border-gray-200 text-gray-700 px-4 py-3 rounded hover:border-gray-400 transition-colors"
              >
                <span>Copy Batch 2 — Generate output</span>
                <Copy size={11} />
              </button>
            </div>

            <button
              onClick={() => setShowBatchModal(false)}
              className="mt-4 w-full text-xs text-gray-400 hover:text-gray-700 transition-colors py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}