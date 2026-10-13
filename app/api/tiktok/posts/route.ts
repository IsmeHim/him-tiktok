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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    await connectToDatabase();

    if (postId) {
      // Delete single post
      await Post.deleteOne({ _id: postId, userId: session.userId });
      return NextResponse.json({ message: 'ลบประวัติเรียบร้อยแล้ว' });
    } else {
      // Delete all failed posts
      await Post.deleteMany({ userId: session.userId, status: 'FAILED' });
      return NextResponse.json({ message: 'ลบรายการที่ล้มเหลวทั้งหมดเรียบร้อยแล้ว' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
  }
}
