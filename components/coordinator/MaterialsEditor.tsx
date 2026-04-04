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
    ? 'Both WAEC (essay/structured) and JAMB (multiple choice) exam styles apply.'
    : isWAEC ? 'WAEC exam style — essay and structured questions.'
    : isJAMB ? 'JAMB exam style — multiple choice only.'
    : 'Nigerian secondary school exam style.'

  const objectiveLines = objectives.length > 0
    ? objectives.map((o, i) => `${i + 1}. ${o.text}${o.examName ? ` [${o.examName}]` : ''}`).join('\n')
    : 'No objectives set yet — use your knowledge of this topic for this exam level.'

  const hasTextbook      = !!materials.textbook?.trim()
  const hasTranscript    = !!materials.transcript?.trim()
  const hasPastQuestions = !!materials.past_questions?.trim()
  const hasExtra         = !!materials.extra?.trim()

  const skipped = [
    hasTextbook      && 'Textbook Notes',
    hasTranscript    && 'YouTube Recommendations',
    hasPastQuestions && 'Past Questions',
    hasExtra         && 'Extra Notes',
  ].filter(Boolean)

  const needed = [
    !hasTextbook      && 'Textbook Notes',
    !hasTranscript    && 'YouTube Recommendations',
    !hasPastQuestions && 'Past Questions',
    !hasExtra         && 'Extra Notes',
  ].filter(Boolean)

  if (needed.length === 0) {
    return `All materials for "${topicName}" are already filled. Nothing to generate.`
  }

  return `You are a senior ${examContext} curriculum specialist and subject matter expert. Your task is to produce high-quality reference materials for a course on the following topic.

---

## TOPIC: ${topicName}
## SUBJECT: ${subjectName}
## EXAM CONTEXT: ${examContext}
## EXAM STYLE: ${examStyle}

---

## LEARNING OBJECTIVES
Students must be able to:
${objectiveLines}

---

## YOUR TASK

Produce the following materials in one response, clearly separated by the section headings below. Every section must directly serve the objectives listed above — do not stray outside their scope.

${skipped.length > 0 ? `The following sections are already filled and do NOT need to be produced:\n${(skipped as string[]).map(s => `- ${s}`).join('\n')}\n` : ''}Think deeply. Draw on your full knowledge of ${subjectName} at ${examContext} level. Be comprehensive but focused. Everything must be accurate, pedagogically sound, and exam-relevant.

---
${!hasTextbook ? `
## SECTION 1: TEXTBOOK NOTES

Write comprehensive, well-structured textbook notes covering every objective above. This is the primary reference material builders will use to create the course.

Requirements:
- Prose paragraphs, not bullet points — write like a textbook
- Use markdown headings to organise by sub-topic or concept
- Define every key term clearly on first use
- Explain the why and the how, not just the what
- Include worked examples where relevant
- Cover every objective — do not skip any
- Appropriate depth for SS1–SS3 Nigerian secondary school students
- End with a one-paragraph summary of the topic

` : ''}${!hasTranscript ? `
## SECTION 2: YOUTUBE VIDEO RECOMMENDATIONS

Recommend 3 to 5 YouTube videos that teach "${topicName}" at Nigerian secondary school level.

For each video:
- **Title** — exact or likely title
- **Channel** — channel name
- **Search query** — what to search on YouTube to find it
- **Why relevant** — which objectives it covers and why it helps
- **Caution** — any parts the builder should skip or verify

Prioritise Nigerian educators, African educational channels, and channels known for ${examContext} preparation. If you are confident in a URL, include it. Otherwise give a precise search query.

After watching these videos, the coordinator will paste the transcript into the materials editor manually.

` : ''}${!hasPastQuestions ? `
## SECTION 3: PAST EXAM QUESTIONS

Generate exam questions for "${topicName}" modelled on real ${examContext} question patterns.

${isJAMB ? `**JAMB Questions (Multiple Choice)**
Generate 15 multiple choice questions (options A–D).
- Mark the correct answer with ✓
- Write a one-line explanation for each correct answer
- Tag each question with the objective number it tests` : ''}

${isWAEC ? `**WAEC Questions**
Generate:
- 3 essay questions (10 marks each) with marking scheme bullet points
- 4 structured questions (5 marks each) with model answers
- Tag each question with the objective number it tests` : ''}

${!isWAEC && !isJAMB ? `Generate:
- 10 multiple choice questions (A–D) with answers marked
- 4 short answer questions with model answers
- Tag each with the objective it tests` : ''}

Base all questions strictly on the objectives. Do not introduce content outside the scope above.

` : ''}${!hasExtra ? `
## SECTION 4: EXAM TRAPS AND QUICK NOTES

Write a sharp, punchy exam-focused notes section. This is NOT a repeat of the textbook — it is what students need to score marks.

Include:
- The 3 to 5 most common mistakes students make on this topic in ${examContext} exams
- Key distinctions examiners test (things students typically confuse)
- Mnemonics or memory aids for any lists, sequences, or classifications
- Power phrases — exact wording that scores marks in WAEC essay answers
- Any facts that appear repeatedly across multiple years of past questions

Keep it concise. Bullet points are fine here.

` : ''}---

Output all sections above in sequence, using the exact section headings. Use markdown throughout. Do not add commentary outside the sections.`
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