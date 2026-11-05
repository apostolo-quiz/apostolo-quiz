import { NextRequest, NextResponse } from 'next/server';
import { getRoomsServer, createRoomServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rooms = await getRoomsServer();
    // Retorna resumo das salas sem expor a palavra-chave secreta para quem não está na sala
    const sanitized = rooms.map((r) => ({
      id: r.id,
      name: r.name,
      createdBy: r.createdBy,
      createdByName: r.createdByName,
      creatorTitle: r.creatorTitle,
      membersCount: r.members.length,
      maxMembers: r.maxMembers || 20,
      status: r.status,
      level: r.level,
      totalQuestions: r.totalQuestions,
      currentQuestionIndex: r.currentQuestionIndex,
      hasPasscode: Boolean(r.passcode),
      createdAt: r.createdAt
    }));

    return NextResponse.json({ success: true, rooms: sanitized });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.passcode) {
      return NextResponse.json(
        { success: false, message: 'Nome da sala e palavra-chave são obrigatórios.' },
        { status: 400 }
      );
    }

    const created = await createRoomServer({
      name: body.name,
      passcode: body.passcode,
      createdBy: body.createdBy || 'user_guest_' + Date.now(),
      createdByName: body.createdByName || 'Irmão Convidado',
      creatorTitle: body.creatorTitle || 'Irmão',
      level: body.level || 'basico',
      maxMembers: body.maxMembers || 20
    });

    return NextResponse.json({ success: true, room: created });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
