import { NextRequest, NextResponse } from 'next/server';
import { handleFriendActionServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload } = body;
    if (!action || !payload || !payload.userId) {
      return NextResponse.json({ success: false, message: 'Parâmetros inválidos.' }, { status: 400 });
    }
    const result = await handleFriendActionServer(action, payload);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
