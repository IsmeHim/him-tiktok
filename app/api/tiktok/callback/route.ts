import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, fetchTikTokUserInfo } from '@/lib/tiktok';
import { connectToDatabase } from '@/lib/mongodb';
import { TikTokAccount } from '@/models/TikTokAccount';
import { getSessionFromRequest } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const dashboardUrl = new URL('/dashboard', appUrl);

  if (error) {
    dashboardUrl.searchParams.set('tiktok_error', errorDescription || error);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set('tiktok_error', 'Authorization code not provided');
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    // Verify user session
    let userId: string | null = null;
    let stateVerifier: string | undefined;
    const session = await getSessionFromRequest(request);
    if (session) {
      userId = session.userId;
    }
    
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
        if (!userId) userId = decodedState.userId;
        stateVerifier = decodedState.verifier;
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }

    if (!userId) {
      dashboardUrl.searchParams.set('tiktok_error', 'User session expired. Please log in again.');
      return NextResponse.redirect(dashboardUrl);
    }

    const redirectUri = `${appUrl}/api/tiktok/callback`;
    const cookieVerifier = request.cookies.get('tiktok_code_verifier')?.value;
    const finalVerifier = cookieVerifier || stateVerifier;

    console.log('Exchanging TikTok token with redirectUri:', redirectUri, 'verifier present:', !!finalVerifier);
    const tokenData = await exchangeCodeForToken(code, redirectUri, finalVerifier);
    console.log('TikTok token exchange result:', JSON.stringify(tokenData));

    const resAny = tokenData as any;
    // TikTok OAuth token endpoint returns fields at root level or under data:
    const accessToken = resAny.access_token || resAny.data?.access_token;
    const openId = resAny.open_id || resAny.data?.open_id;
    const expiresIn = resAny.expires_in || resAny.data?.expires_in || 86400;
    const refreshToken = resAny.refresh_token || resAny.data?.refresh_token;
    const refreshExpiresIn = resAny.refresh_expires_in || resAny.data?.refresh_expires_in;
    const scope = resAny.scope || resAny.data?.scope;

    if (!accessToken || !openId) {
      const errMsg =
        resAny.error_description ||
        resAny.error?.message ||
        resAny.message ||
        (resAny.error ? JSON.stringify(resAny.error) : JSON.stringify(resAny));
      console.error('TikTok token error response:', errMsg);
      dashboardUrl.searchParams.set('tiktok_error', errMsg);
      return NextResponse.redirect(dashboardUrl);
    }

    // Fetch user profile info from TikTok
    const userInfo = await fetchTikTokUserInfo(accessToken);

    await connectToDatabase();

    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const refreshTokenExpiresAt = refreshExpiresIn
      ? new Date(Date.now() + refreshExpiresIn * 1000)
      : undefined;

    const scopesArray = typeof scope === 'string' ? scope.split(',') : (scope || []);

    // Upsert TikTok Account for the User
    await TikTokAccount.findOneAndUpdate(
      { userId },
      {
        userId,
        openId: openId,
        unionId: userInfo?.union_id || '',
        avatarUrl: userInfo?.avatar_url || userInfo?.avatar_url_100 || '',
        displayName: userInfo?.display_name || 'TikTok Creator',
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt,
        refreshTokenExpiresAt,
        scope: scopesArray,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    dashboardUrl.searchParams.set('tiktok_success', 'connected');
    return NextResponse.redirect(dashboardUrl);
  } catch (err: any) {
    console.error('TikTok Callback Exception:', err);
    dashboardUrl.searchParams.set('tiktok_error', err.message || 'Error occurred during TikTok connection');
    return NextResponse.redirect(dashboardUrl);
  }
}
