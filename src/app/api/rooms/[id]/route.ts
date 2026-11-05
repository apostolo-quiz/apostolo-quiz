import { NextRequest, NextResponse } from 'next/server';
import { getRoomByIdServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await getRoomByIdServer(params.id);
    if (!room) {
      return NextResponse.json({ success: false, message: 'Sala não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, room });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
