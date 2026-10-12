import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/mongodb';
import { Post } from '@/models/Post';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const posts = await Post.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Fetch Posts Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
