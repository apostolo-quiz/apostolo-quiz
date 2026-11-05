import { NextRequest, NextResponse } from 'next/server';
import { joinRoomServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { passcode, member, userEmail } = body;

    if (!member || !member.name) {
      return NextResponse.json({ success: false, message: 'Dados do membro são necessários.' }, { status: 400 });
    }

    const result = await joinRoomServer(params.id, passcode || '', {
      ...member,
      userEmail: userEmail || member.userEmail
    });
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 403 });
    }

    return NextResponse.json({ success: true, room: result.room });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
