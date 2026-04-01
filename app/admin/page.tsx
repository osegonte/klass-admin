import Link from 'next/link'

const sections = [
  {
    label: 'SUBJECTS & TOPICS',
    href: '/admin/subjects',
    desc: 'Manage the universal curriculum bank. Add subjects, topics, subtopics and assign tracks.',
  },
  {
    label: 'TEACHERS',
    href: '/admin/teachers',
    desc: 'View and manage coordinator and builder accounts. Set roles and activate accounts.',
  },
]

export default function AdminHome() {
  return (
    <div>
      <div className="mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
          Dashboard
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          KLASS Studio administration panel.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 rounded max-w-2xl">
        {sections.map(({ label, href, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-white px-5 py-4 flex items-start justify-between gap-4 hover:bg-stone-50 transition-colors group"
          >
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-900 mb-1">
                {label}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
            <span className="text-gray-300 group-hover:text-gray-600 transition-colors text-lg leading-none mt-0.5">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}