import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionFromRequest } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', '/dashboard');
      return NextResponse.redirect(loginUrl);
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    if (!clientKey) {
      return NextResponse.json(
        { error: 'TikTok Client Key is not configured' },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const redirectUri = `${appUrl}/api/tiktok/callback`;

    // PKCE (Proof Key for Code Exchange) required by TikTok OAuth v2
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // CSRF State parameter containing user ID, random token AND codeVerifier
    // (This guarantees codeVerifier is preserved even if cookies are dropped during 3rd party redirect)
    const randomHex = crypto.randomBytes(16).toString('hex');
    const statePayload = Buffer.from(
      JSON.stringify({
        userId: session.userId,
        salt: randomHex,
        verifier: codeVerifier,
      })
    ).toString('base64url');

    // Scopes needed for profile, video draft uploads AND direct posting
    const scope = 'user.info.basic,video.upload,video.publish';

    // TikTok OAuth 2.0 Authorization URL
    const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    tiktokAuthUrl.searchParams.set('client_key', clientKey);
    tiktokAuthUrl.searchParams.set('scope', scope);
    tiktokAuthUrl.searchParams.set('response_type', 'code');
    tiktokAuthUrl.searchParams.set('redirect_uri', redirectUri);
    tiktokAuthUrl.searchParams.set('state', statePayload);
    tiktokAuthUrl.searchParams.set('code_challenge', codeChallenge);
    tiktokAuthUrl.searchParams.set('code_challenge_method', 'S256');

    const response = NextResponse.redirect(tiktokAuthUrl.toString());

    // Save state & code_verifier in cookie
    response.cookies.set('tiktok_oauth_state', statePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    response.cookies.set('tiktok_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,
    });

    return response;
  } catch (error: any) {
    console.error('TikTok Auth Init Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate TikTok Authorization' },
      { status: 500 }
    );
  }
}
