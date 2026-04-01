import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({
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

  if (!teacher || teacher.role !== 'admin') redirect('/login')

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminNav
        displayName={teacher.display_name}
        email={teacher.email}
      />
      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}