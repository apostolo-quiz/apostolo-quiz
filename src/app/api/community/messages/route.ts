import { NextRequest, NextResponse } from 'next/server';
import { getDirectMessagesServer, sendDirectMessageServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';
    const otherUserId = searchParams.get('otherUserId') || '';
    if (!userId || !otherUserId) {
      return NextResponse.json({ success: false, messages: [] });
    }
    const messages = await getDirectMessagesServer(userId, otherUserId);
    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.fromUserId || !body.toUserId || !body.text) {
      return NextResponse.json({ success: false, message: 'Dados incompletos.' }, { status: 400 });
    }
    const result = await sendDirectMessageServer(body);
    if (!result.success && result.blocked) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
