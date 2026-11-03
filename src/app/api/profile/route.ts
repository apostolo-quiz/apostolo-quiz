import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileServer, saveUserProfileServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const email = searchParams.get('email') || undefined;

    const profile = await getUserProfileServer(userId, email);
    if (profile) {
      return NextResponse.json({ success: true, profile });
    }
    return NextResponse.json({ success: false, message: 'Perfil não encontrado' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const profile = body.profile || body;
    if (!profile || !profile.name) {
      return NextResponse.json({ success: false, message: 'Nome é obrigatório' }, { status: 400 });
    }
    const saved = await saveUserProfileServer(profile);
    return NextResponse.json({ success: true, profile: saved });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
