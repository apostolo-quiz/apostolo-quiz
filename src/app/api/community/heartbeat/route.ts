import { NextRequest, NextResponse } from 'next/server';
import { handleHeartbeatServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await handleHeartbeatServer(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
