interface Block {
  id:              string
  type:            string
  title:           string
  body:            string
  analogy?:        string
  breakdown?:      string
  diagram_prompt?: string
  steps?:          any[]
}

interface Flashcard {
  id:    string
  front: string
  back:  string
}

interface Props {
  blocks:     Block[]
  flashcards: Flashcard[]
}

export default function CoursePreview({ blocks, flashcards }: Props) {
  if (blocks.length === 0 && flashcards.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
        <p className="text-sm text-gray-400">Nothing to preview yet.</p>
        <p className="text-xs text-gray-400 mt-1">
          Switch to Build and add some blocks first.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {blocks.map(block => (
        <BlockPreview key={block.id} block={block} />
      ))}

      {flashcards.length > 0 && (
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
            Flashcards
          </p>
          <div className="flex flex-col gap-3">
            {flashcards.map(card => (
              <div
                key={card.id}
                className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-2 gap-4"
              >
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Front</p>
                  <p className="text-sm text-gray-800">{card.front || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Back</p>
                  <p className="text-sm text-gray-800">{card.back || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BlockPreview({ block }: { block: Block }) {
  switch (block.type) {

    case 'definition':
      return (
        <div className="border-l-2 border-purple-400 pl-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Definition</p>
          <p className="text-base font-semibold text-gray-900">{block.title}</p>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{block.body}</p>
          {block.analogy && (
            <p className="text-sm text-gray-500 mt-2 italic">{block.analogy}</p>
          )}
        </div>
      )

    case 'explanation':
      return (
        <div>
          {block.title && (
            <p className="text-sm font-semibold text-gray-900 mb-1.5">{block.title}</p>
          )}
          <p className="text-sm text-gray-700 leading-relaxed">{block.body}</p>
        </div>
      )

    case 'formula':
      return (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-amber-700 mb-2">{block.title}</p>
          <p className="text-lg font-mono text-center text-gray-900 py-2">{block.body}</p>
          {block.breakdown && (
            <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-amber-100 leading-relaxed">
              {block.breakdown}
            </p>
          )}
        </div>
      )

    case 'example':
      return (
        <div>
          {block.title && (
            <p className="text-sm font-semibold text-gray-900 mb-2">{block.title}</p>
          )}
          <div className="flex flex-col gap-2">
            {(block.steps ?? []).map((step: any, i: number) => (
              <div key={step.id ?? i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                    <span className="text-xs text-gray-500">{i + 1}</span>
                  </div>
                  {i < (block.steps ?? []).length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-sm font-mono text-gray-900">{step.expression}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.talkingPoint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'keypoint':
      return (
        <div className="border border-gray-900 rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1.5">Key Point</p>
          <p className="text-sm text-gray-900 leading-relaxed">{block.body}</p>
        </div>
      )

    case 'note':
      return (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1.5">Note</p>
          <p className="text-sm text-gray-600 leading-relaxed">{block.body}</p>
        </div>
      )

    case 'diagram':
      return (
        <div className="border-2 border-dashed border-teal-200 rounded-lg p-8 text-center bg-teal-50">
          <p className="text-xs font-semibold text-teal-600">{block.title || 'Diagram'}</p>
          {block.body && <p className="text-xs text-teal-500 mt-1">{block.body}</p>}
          <p className="text-xs text-teal-400 mt-3">Diagram renders in student view</p>
        </div>
      )

    case 'table':
      return (
        <div>
          {block.title && (
            <p className="text-sm font-semibold text-gray-900 mb-2">{block.title}</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {block.body.split('\n').filter(l => l.trim()).map((line, i) => {
                  const isHeader = line.toLowerCase().startsWith('headers:')
                  const cells    = line.replace(/^(headers|row):\s*/i, '').split('|').map(c => c.trim())
                  return isHeader ? (
                    <tr key={i} className="bg-stone-50">
                      {cells.map((cell, j) => (
                        <th key={j} className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  ) : (
                    <tr key={i}>
                      {cells.map((cell, j) => (
                        <td key={j} className="border border-gray-200 px-3 py-2 text-xs text-gray-600">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )

    default:
      return (
        <div className="bg-stone-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">{block.body}</p>
        </div>
      )
  }
}
