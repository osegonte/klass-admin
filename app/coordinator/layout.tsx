import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CoordinatorNav from '@/components/coordinator/CoordinatorNav'

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('role, display_name, email')
    .eq('id', user.id)
    .single()

  if (!teacher || teacher.role !== 'coordinator') redirect('/login')

  return (
    <div className="min-h-screen bg-stone-50">
      <CoordinatorNav
        displayName={teacher.display_name}
        email={teacher.email}
      />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {children}
      </main>
    </div>
  )
}