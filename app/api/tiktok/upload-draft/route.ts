import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/mongodb';
import { TikTokAccount } from '@/models/TikTokAccount';
import { Post } from '@/models/Post';
import {
  getValidTikTokAccessToken,
  initializeInboxVideoPost,
  initializeDirectVideoPost,
  uploadVideoChunk,
} from '@/lib/tiktok';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if TikTok account is connected
    const account = await TikTokAccount.findOne({ userId: session.userId });
    if (!account) {
      return NextResponse.json(
        { error: 'No TikTok account connected. Please connect your TikTok account first.' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const videoFile = formData.get('video') as File | null;
    const caption = (formData.get('caption') as string) || '';
    const postMode = (formData.get('postMode') as string) || 'DIRECT'; // 'DIRECT' (Direct Post with caption) or 'INBOX' (Draft)
    const privacyLevel = (formData.get('privacyLevel') as string) || 'SELF_ONLY'; // 'SELF_ONLY' (Private) or 'PUBLIC_TO_EVERYONE'
    const allowComment = formData.get('allowComment') === 'true';
    const allowDuet = formData.get('allowDuet') === 'true';
    const isAigc = formData.get('isAigc') === 'true';

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!videoFile.name.toLowerCase().endsWith('.mp4')) {
      return NextResponse.json(
        { error: 'Invalid file format. Only MP4 videos are supported.' },
        { status: 400 }
      );
    }

    const videoBytes = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(videoBytes);
    const videoSize = videoBuffer.byteLength;

    if (videoSize === 0) {
      return NextResponse.json(
        { error: 'Video file is empty' },
        { status: 400 }
      );
    }

    // 1. Create a Post record with PENDING status
    const postRecord = await Post.create({
      userId: session.userId,
      title: caption,
      videoFileName: videoFile.name,
      videoFileSize: videoSize,
      status: 'PROCESSING',
      privacyLevel: privacyLevel,
      disableComment: !allowComment,
      disableDuet: !allowDuet,
      isAigc: isAigc,
    });

    // 2. Ensure valid TikTok Access Token (refreshes if needed)
    const validAccessToken = await getValidTikTokAccessToken(account);

    // 3. Initialize video upload based on postMode
    let initResponse: any;

    if (postMode === 'DIRECT') {
      // Direct Post endpoint: TikTok applies title & caption directly to the video!
      initResponse = await initializeDirectVideoPost({
        accessToken: validAccessToken,
        videoSize,
        title: caption,
        privacyLevel: privacyLevel,
        disableComment: !allowComment,
        disableDuet: !allowDuet,
        disableStitch: !allowDuet,
        isAigc: isAigc,
      });
    } else {
      // Inbox Mode: sends video as raw draft into user's Inbox
      initResponse = await initializeInboxVideoPost({
        accessToken: validAccessToken,
        videoSize,
        chunkSize: videoSize,
        totalChunkCount: 1,
        title: caption,
        disableComment: !allowComment,
        disableDuet: !allowDuet,
        isAigc: isAigc,
      });
    }

    console.log('TikTok init post response:', JSON.stringify(initResponse));

    const resObj = initResponse as any;
    // TikTok may return upload_url at root level OR inside data object
    const uploadUrl = resObj.data?.upload_url || resObj.upload_url;
    const publishId = resObj.data?.publish_id || resObj.publish_id;

    if (!uploadUrl) {
      const errObj = resObj.error || resObj;
      const errorMsg =
        errObj.message ||
        errObj.error_description ||
        JSON.stringify(errObj);
      
      console.error('Failed to init TikTok video upload:', errorMsg);

      // Update record to FAILED
      postRecord.status = 'FAILED';
      postRecord.errorMessage = errorMsg;
      await postRecord.save();

      return NextResponse.json(
        {
          error: errorMsg,
          rawError: initResponse,
          postId: postRecord._id,
        },
        { status: 400 }
      );
    }

    const { publish_id, upload_url } = { publish_id: publishId, upload_url: uploadUrl };

    // 4. Upload binary chunk to TikTok upload_url
    const contentRange = `bytes 0-${videoSize - 1}/${videoSize}`;
    const uploadRes = await uploadVideoChunk({
      uploadUrl: upload_url,
      videoBuffer,
      contentRange,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      postRecord.status = 'FAILED';
      postRecord.errorMessage = `Failed to upload binary video chunk to TikTok: ${uploadRes.status} ${errorText}`;
      await postRecord.save();

      return NextResponse.json(
        {
          error: postRecord.errorMessage,
          postId: postRecord._id,
        },
        { status: 502 }
      );
    }

    // 5. Update Post status to UPLOADED_TO_DRAFT
    postRecord.publishId = publish_id;
    postRecord.status = 'UPLOADED_TO_DRAFT';
    await postRecord.save();

    return NextResponse.json({
      message: 'Video successfully sent to TikTok draft!',
      publishId: publish_id,
      post: postRecord,
    });
  } catch (error: any) {
    console.error('Upload Draft Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during draft upload' },
      { status: 500 }
    );
  }
}
