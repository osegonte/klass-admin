import Link from 'next/link'
import ImportClient from '@/components/admin/ImportClient'

export default function ImportPage() {
  return (
    <div>
      <div className="mb-8 pb-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
            Import Curriculum
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Upload a JSON file to seed the universal subject bank. Safe to run multiple times.
          </p>
        </div>
        <Link
          href="/admin/subjects"
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← Back to Subjects
        </Link>
      </div>
      <ImportClient />
    </div>
  )
}