import { NextResponse } from 'next/server'
import { logoutSession } from '@/lib/auth'

export async function POST() {
  await logoutSession()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), 303)
}
