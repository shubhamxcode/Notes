import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export interface JWTPayload {
  userId: string
  email: string
  role: string
  tenantId: string
  tenantSlug: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    tenantId: payload.tenantId,
    tenantSlug: payload.tenantSlug
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      tenantId: payload.tenantId as string,
      tenantSlug: payload.tenantSlug as string
    }
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                request.cookies.get('token')?.value

  if (!token) return null

  return verifyToken(token)
} 