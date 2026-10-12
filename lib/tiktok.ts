import { ITikTokAccount, TikTokAccount } from '@/models/TikTokAccount';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';

export interface TikTokTokenResponse {
  data: {
    open_id: string;
    scope: string;
    access_token: string;
    expires_in: number;
    refresh_token: string;
    refresh_expires_in: number;
    token_type: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TikTokUserInfoResponse {
  data: {
    user: {
      open_id: string;
      union_id?: string;
      avatar_url?: string;
      avatar_url_100?: string;
      display_name?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Exchange Authorization Code for TikTok Access Token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<TikTokTokenResponse> {
  const url = 'https://open.tiktokapis.com/v2/oauth/token/';
  
  const bodyParams: Record<string, string> = {
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  };

  if (codeVerifier) {
    bodyParams.code_verifier = codeVerifier;
  }

  const body = new URLSearchParams(bodyParams);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: body.toString(),
  });

  const data = await response.json();
  return data;
}

/**
 * Refresh an expired TikTok Access Token using the Refresh Token
 */
export async function refreshTikTokToken(
  refreshToken: string
): Promise<TikTokTokenResponse> {
  const url = 'https://open.tiktokapis.com/v2/oauth/token/';

  const body = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: body.toString(),
  });

  const data = await response.json();
  return data;
}

/**
 * Fetch basic user info from TikTok API
 */
export async function fetchTikTokUserInfo(
  accessToken: string
): Promise<TikTokUserInfoResponse['data']['user'] | null> {
  try {
    const fields = 'open_id,union_id,avatar_url,avatar_url_100,display_name';
    const response = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const json = (await response.json()) as TikTokUserInfoResponse;
    if (json.data && json.data.user) {
      return json.data.user;
    }
    return null;
  } catch (err) {
    console.error('Error fetching TikTok user info:', err);
    return null;
  }
}

/**
 * Helper to ensure a TikTok account has a valid access token.
 * Refreshes token automatically if expired or about to expire in 5 minutes.
 */
export async function getValidTikTokAccessToken(account: ITikTokAccount): Promise<string> {
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  const isExpiringSoon = new Date(account.expiresAt).getTime() - now.getTime() < bufferTime;

  if (!isExpiringSoon) {
    return account.accessToken;
  }

  // Token is expired or expiring soon, refresh it
  try {
    const refreshed = await refreshTikTokToken(account.refreshToken);
    if (!refreshed.data?.access_token) {
      throw new Error(refreshed.error?.message || 'Failed to refresh TikTok access token');
    }

    const {
      access_token,
      expires_in,
      refresh_token,
      refresh_expires_in,
    } = refreshed.data;

    account.accessToken = access_token;
    account.expiresAt = new Date(Date.now() + expires_in * 1000);
    if (refresh_token) {
      account.refreshToken = refresh_token;
      if (refresh_expires_in) {
        account.refreshTokenExpiresAt = new Date(Date.now() + refresh_expires_in * 1000);
      }
    }
    await account.save();

    return account.accessToken;
  } catch (error) {
    console.error('Auto-refresh token error:', error);
    // If refresh fails, return current token and let TikTok API respond
    return account.accessToken;
  }
}

export interface TikTokInitPostResponse {
  data?: {
    publish_id: string;
    upload_url: string;
  };
  error?: {
    code: string;
    message: string;
    log_id?: string;
  };
}

/**
 * Initialize TikTok Video Posting (Draft / Direct Post Inbox)
 * TikTok Content Posting API v2:
 * POST https://open.tiktokapis.com/v2/post/publish/inbox/video/init/
 */
export async function initializeInboxVideoPost(params: {
  accessToken: string;
  videoSize: number;
  chunkSize?: number;
  totalChunkCount?: number;
}): Promise<TikTokInitPostResponse> {
  const url = 'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/';

  const payload = {
    source_info: {
      source: 'FILE_UPLOAD',
      video_size: params.videoSize,
      chunk_size: params.chunkSize || params.videoSize,
      total_chunk_count: params.totalChunkCount || 1,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}

/**
 * Alternative Creator Post / Direct Post Init (if sandbox permissions differ)
 */
export async function initializeDirectVideoPost(params: {
  accessToken: string;
  videoSize: number;
  title: string;
  privacyLevel?: string;
  disableDuet?: boolean;
  disableComment?: boolean;
  disableStitch?: boolean;
  isAigc?: boolean;
}): Promise<TikTokInitPostResponse> {
  const url = 'https://open.tiktokapis.com/v2/post/publish/video/init/';

  const payload = {
    post_info: {
      title: params.title,
      privacy_level: params.privacyLevel || 'SELF_ONLY',
      disable_duet: params.disableDuet ?? false,
      disable_comment: params.disableComment ?? false,
      disable_stitch: params.disableStitch ?? false,
      video_cover_timestamp_ms: 1000,
      brand_content_toggle: false,
      brand_organic_toggle: false,
      is_aigc: params.isAigc ?? false,
    },
    source_info: {
      source: 'FILE_UPLOAD',
      video_size: params.videoSize,
      chunk_size: params.videoSize,
      total_chunk_count: 1,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}

/**
 * Upload binary video buffer to the upload_url returned from init
 */
export async function uploadVideoChunk(params: {
  uploadUrl: string;
  videoBuffer: Buffer;
  contentRange: string; // e.g. "bytes 0-1048575/1048576"
}): Promise<Response> {
  // Convert Node Buffer to Uint8Array for browser/Next.js fetch compatibility
  const uint8 = new Uint8Array(params.videoBuffer);
  return await fetch(params.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Range': params.contentRange,
      'Content-Type': 'video/mp4',
    },
    body: uint8,
  });
}
