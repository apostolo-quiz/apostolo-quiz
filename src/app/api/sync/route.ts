import { NextRequest, NextResponse } from 'next/server';
import { saveUserProfileServer, saveQuizProgressServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let savedProfile = null;
    let savedProgress = null;

    if (body.profile && body.profile.name) {
      savedProfile = await saveUserProfileServer(body.profile);
    }

    if (body.progress) {
      const uId = body.progress.userId || (savedProfile && savedProfile.id) || 'user_default';
      savedProgress = await saveQuizProgressServer(uId, body.progress);
    }

    return NextResponse.json({
      success: true,
      profile: savedProfile,
      progress: savedProgress,
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
