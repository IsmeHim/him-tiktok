import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { TikTokAccount } from '@/models/TikTokAccount';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an associated TikTok account
    const tiktokAccount = await TikTokAccount.findOne({ userId: user._id });

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      tiktokAccount: tiktokAccount
        ? {
            id: tiktokAccount._id,
            openId: tiktokAccount.openId,
            displayName: tiktokAccount.displayName,
            avatarUrl: tiktokAccount.avatarUrl,
            isConnected: true,
            expiresAt: tiktokAccount.expiresAt,
            scope: tiktokAccount.scope,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Auth Me Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
