import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET || 'chave-secreta-padrao-temporaria'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return null
  }
}

export async function loginSession(userId: number, username: string, isAdmin: boolean) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, username, isAdmin, expires })

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export async function logoutSession() {
  const cookieStore = await cookies()
  cookieStore.set('session', '', {
    expires: new Date(0),
    httpOnly: true,
    path: '/',
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return await decrypt(session)
}
