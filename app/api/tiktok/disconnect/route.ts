import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/mongodb';
import { TikTokAccount } from '@/models/TikTokAccount';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await TikTokAccount.deleteOne({ userId: session.userId });

    return NextResponse.json({ message: 'TikTok account disconnected successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to disconnect account' }, { status: 500 });
  }
}
