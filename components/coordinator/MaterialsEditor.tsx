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
  topicName:   string,
  subjectName: string,
  examNames:   string[],
  objectives:  Objective[],
  materials:   Materials,
): string {
  const examContext = examNames.length > 0 ? examNames.join(' and ') : 'Nigerian secondary school'
  const isWAEC = examNames.some(e => e.toLowerCase().includes('waec'))
  const isJAMB = examNames.some(e => e.toLowerCase().includes('jamb'))

  const examStyle = isWAEC && isJAMB
    ? 'Both WAEC (essay/structured) and JAMB (multiple choice)'
    : isWAEC ? 'WAEC (essay and structured questions)'
    : isJAMB ? 'JAMB (multiple choice)'
    : 'Nigerian secondary school'

  const objectiveLines = objectives.length > 0
    ? objectives.map((o, i) => `${i + 1}. ${o.text}${o.examName ? ` [${o.examName}]` : ''}`).join('\n')
    : 'No objectives set yet.'

  const hasTextbook      = !!materials.textbook?.trim()
  const hasTranscript    = !!materials.transcript?.trim()
  const hasPastQuestions = !!materials.past_questions?.trim()
  const hasExtra         = !!materials.extra?.trim()

  const needed: string[] = [
    !hasTextbook      && 'Textbook Notes',
    !hasTranscript    && 'YouTube Transcript',
    !hasPastQuestions && 'Past Questions',
    !hasExtra         && 'Extra Notes',
  ].filter(Boolean) as string[]

  if (needed.length === 0) {
    return `All materials for "${topicName}" are already filled. Nothing to generate.`
  }

  const textbookPrompt = `---
TEXTBOOK SUB-CHAT PROMPT
Open a new chat and paste exactly this:

"You are a ${examStyle} curriculum writer. Write comprehensive textbook-style notes on the topic: ${topicName} (${subjectName}).

The notes must cover these learning objectives:
${objectiveLines}

Rules:
- Write in flowing prose like a real textbook — no bullet points
- Use markdown headings to organise sections
- Define every key term on first use
- Explain concepts with examples
- Appropriate level: Nigerian SS1–SS3 students
- Do not include exam questions or tips — textbook content only
- End with a short summary paragraph

Output in a single markdown code block."

Once you have the output, paste it back here for review.`

  const transcriptPrompt = `---
YOUTUBE SUB-CHAT PROMPT
Open a new chat and paste exactly this:

"Search YouTube for videos teaching: ${topicName} (${subjectName}) at Nigerian secondary school level for ${examStyle} preparation.

List 4 videos with:
- Title
- Channel name
- Direct URL or search query to find it
- Which of these objectives it covers: ${objectives.map((o, i) => `(${i + 1}) ${o.text}`).join('; ')}
- Timestamp of the most relevant section if known

Prioritise Nigerian educators and African channels. Do not generate content — only recommend real videos the user can watch and transcribe."

Watch the most relevant video, get the transcript (use YouTube's transcript feature or a tool like tactiq.io), and paste it back here for review.`

  const pastQuestionsPrompt = `---
PAST QUESTIONS SUB-CHAT PROMPT
Open a new chat and paste exactly this:

"Generate ${examStyle} exam questions for: ${topicName} (${subjectName}).

Base all questions strictly on these objectives:
${objectiveLines}

${isJAMB ? `Format — JAMB style:
- 15 multiple choice questions (A, B, C, D)
- Mark correct answer with ✓
- One-line explanation per answer
- Label which objective each question tests` : ''}
${isWAEC ? `Format — WAEC style:
- 3 essay questions (10 marks each) with marking scheme
- 4 structured questions (5 marks each) with model answers
- Label which objective each question tests` : ''}
${!isWAEC && !isJAMB ? `Format:
- 10 multiple choice questions (A–D) with answers
- 4 short answer questions with model answers
- Label which objective each question tests` : ''}

Do not introduce any content outside the objectives above."

Paste the output back here for review.`

  const extraPrompt = `---
EXTRA NOTES SUB-CHAT PROMPT
Open a new chat and paste exactly this:

"Write concise exam-focused revision notes for: ${topicName} (${subjectName}) — ${examStyle}.

Cover only what students need to score marks. Based on these objectives:
${objectiveLines}

Include:
- Top 3–5 mistakes students make on this topic in exams
- Key distinctions examiners test (what students confuse)
- Mnemonics for any lists or sequences
- Power phrases that score marks in ${isWAEC ? 'WAEC essay' : 'exam'} answers
- Facts that appear repeatedly in past papers

Bullet points only. No prose. No repetition of textbook content."

Paste the output back here for review.`

  const sections = [
    !hasTextbook      && textbookPrompt,
    !hasTranscript    && transcriptPrompt,
    !hasPastQuestions && pastQuestionsPrompt,
    !hasExtra         && extraPrompt,
  ].filter(Boolean).join('\n\n')

  return `You are the materials coordinator for a KLASS Studio course. Your job is NOT to generate content yourself. Your job is to orchestrate the collection of high-quality materials for this topic and review each piece against the learning objectives before approving it.

## TOPIC: ${topicName}
## SUBJECT: ${subjectName}
## EXAM: ${examStyle}

## LEARNING OBJECTIVES
${objectiveLines}

## QUALITY FILTER
Every piece of material you receive must be checked against the objectives above. When reviewing:
- Does it cover all the objectives it should?
- Is the level appropriate for Nigerian SS1–SS3?
- Is it accurate and exam-relevant?
- Does it stay within scope — no irrelevant content?

If a piece fails any of these checks, tell the user exactly what is wrong and what to ask the sub-chat to fix.

---

## WHAT WE NEED

The following materials are missing and must be collected. Work through them one at a time. Do not move to the next section until the current one is approved.

${sections}

---

## HOW TO PROCEED

Start with the first missing section above. Give the user the sub-chat prompt, wait for them to paste the result back, review it against the objectives, and either:
- Say APPROVED and move to the next section, or
- Say NEEDS REVISION with specific feedback on what to fix

When all sections are approved, summarise everything that was collected and confirm the materials are ready to paste into KLASS Studio.

Begin now — give the user the first sub-chat prompt.`
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

  const [open,   setOpen]   = useState<Record<string, boolean>>({ textbook: true })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleCopyPrompt = () => {
    const prompt = buildPrompt(topicName, subjectName, examNames, objectives, materials)
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
            {copied
              ? <Check size={11} className="text-green-600" />
              : <Copy size={11} />
            }
            {copied ? 'Copied' : 'Copy prompt'}
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
    </div>
  )
}