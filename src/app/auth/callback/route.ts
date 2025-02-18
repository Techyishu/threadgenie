import { CookieOptions, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          }
        }
      }
    )

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)
    
    // Explicitly wait for session to be established
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // Add a small delay to ensure session is properly propagated
      await new Promise(resolve => setTimeout(resolve, 500))
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // If something goes wrong, redirect to home page
  return NextResponse.redirect(new URL('/', request.url))
} 