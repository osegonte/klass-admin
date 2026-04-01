import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Not logged in — only allow login and signup
  if (!user) {
    if (pathname !== '/login' && pathname !== '/signup') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Logged in — fetch role
  const { data: teacher } = await supabase
    .from('teachers')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = teacher?.role

  // No role yet — waiting for admin to assign one
  // Allow /pending, block everything else
  if (!role) {
    if (pathname !== '/pending') {
      return NextResponse.redirect(new URL('/pending', request.url))
    }
    return supabaseResponse
  }

  // Has a role — block /login, /signup, /pending
  if (pathname === '/login' || pathname === '/signup' || pathname === '/pending') {
    const dest = role === 'admin' ? '/admin' : role === 'coordinator' ? '/coordinator' : '/builder'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Root redirect
  if (pathname === '/') {
    const dest = role === 'admin' ? '/admin' : role === 'coordinator' ? '/coordinator' : '/builder'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Role-based path protection
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${role}`, request.url))
  }
  if (pathname.startsWith('/coordinator') && role !== 'coordinator') {
    return NextResponse.redirect(new URL(`/${role}`, request.url))
  }
  if (pathname.startsWith('/builder') && role !== 'builder') {
    return NextResponse.redirect(new URL(`/${role}`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}