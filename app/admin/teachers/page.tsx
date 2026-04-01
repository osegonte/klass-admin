import { createClient } from '@/lib/supabase/server'
import TeachersClient from '@/components/admin/TeachersClient'

export default async function TeachersPage() {
  const supabase = await createClient()

  const { data: teachers } = await supabase
    .from('teachers')
    .select('id, email, display_name, role, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8 pb-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-gray-900">
            Teachers
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {teachers?.length ?? 0} accounts. Manage roles and access.
          </p>
        </div>
      </div>

      <TeachersClient teachers={teachers ?? []} />
    </div>
  )
}