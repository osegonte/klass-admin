interface Objective {
  exam:      string
  objective: string
}

interface Props {
  objectives: Objective[]
}

export default function ObjectivesPanel({ objectives }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
        Objectives
      </p>
      <ul className="flex flex-col gap-2">
        {objectives.map((o, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-gray-300 text-xs shrink-0 mt-0.5 tabular-nums w-4">
              {i + 1}.
            </span>
            <span className="text-sm text-gray-700 leading-snug flex-1">
              {o.objective}
            </span>
            <span className="text-xs text-gray-300 shrink-0">
              {o.exam}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
