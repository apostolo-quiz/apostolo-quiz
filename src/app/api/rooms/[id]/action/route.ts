import { NextRequest, NextResponse } from 'next/server';
import { performRoomActionServer, sendRoomMessageServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === 'send_message') {
      const msgResult = await sendRoomMessageServer(params.id, payload);
      return NextResponse.json(msgResult);
    }

    const result = await performRoomActionServer(params.id, action, payload);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
