import { NextRequest, NextResponse } from 'next/server';
import { getQuizProgressServer, saveQuizProgressServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId é obrigatório' }, { status: 400 });
    }
    const progress = await getQuizProgressServer(userId);
    return NextResponse.json({ success: true, progress });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;
    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId é obrigatório' }, { status: 400 });
    }
    const saved = await saveQuizProgressServer(userId, body);
    return NextResponse.json({ success: true, progress: saved });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
