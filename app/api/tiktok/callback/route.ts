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

    if (tokenData.error || !tokenData.data?.access_token) {
      const errMsg = tokenData.error?.message || (tokenData.error ? JSON.stringify(tokenData.error) : 'Failed to exchange authorization code for access token');
      dashboardUrl.searchParams.set('tiktok_error', errMsg);
      return NextResponse.redirect(dashboardUrl);
    }

    const {
      open_id,
      access_token,
      expires_in,
      refresh_token,
      refresh_expires_in,
      scope,
    } = tokenData.data;

    // Fetch user profile info from TikTok
    const userInfo = await fetchTikTokUserInfo(access_token);

    await connectToDatabase();

    const expiresAt = new Date(Date.now() + expires_in * 1000);
    const refreshTokenExpiresAt = refresh_expires_in
      ? new Date(Date.now() + refresh_expires_in * 1000)
      : undefined;

    const scopesArray = typeof scope === 'string' ? scope.split(',') : (scope || []);

    // Upsert TikTok Account for the User
    await TikTokAccount.findOneAndUpdate(
      { userId },
      {
        userId,
        openId: open_id,
        unionId: userInfo?.union_id || '',
        avatarUrl: userInfo?.avatar_url || userInfo?.avatar_url_100 || '',
        displayName: userInfo?.display_name || 'TikTok Creator',
        accessToken: access_token,
        refreshToken: refresh_token,
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
