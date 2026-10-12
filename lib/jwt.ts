import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cyberpunk_fallback_secret_key_change_in_production_32chars';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const TOKEN_COOKIE_NAME = 'tiktok_draft_token';

export interface UserSessionPayload extends JWTPayload {
  userId: string;
  email: string;
  name?: string;
}

export async function signSessionToken(payload: { userId: string; email: string; name?: string }): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as UserSessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function getSessionFromRequest(request: NextRequest): Promise<UserSessionPayload | null> {
  // Try cookie first
  const cookieToken = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (cookieToken) {
    const session = await verifySessionToken(cookieToken);
    if (session) return session;
  }

  // Fallback to Authorization Header: Bearer <token>
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return await verifySessionToken(token);
  }

  return null;
}

export const AUTH_COOKIE_NAME = TOKEN_COOKIE_NAME;
