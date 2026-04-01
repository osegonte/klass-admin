import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('teachers').select('email, role')

  return (
    <main style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>Supabase Connection Test</h1>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {data && (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
      {data?.length === 0 && (
        <p>Connected. No teachers yet — sign up to create the first row.</p>
      )}
    </main>
  )
}