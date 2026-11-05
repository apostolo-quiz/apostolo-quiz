import { NextRequest, NextResponse } from 'next/server';
import { performAdminActionServer } from '@/server/dbServer';
import { ADMIN_MASTER_EMAIL } from '@/data/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload, adminEmail } = body;

    if (!adminEmail || adminEmail.trim().toLowerCase() !== ADMIN_MASTER_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'Acesso restrito ao Administrador do Sistema.' },
        { status: 403 }
      );
    }

    const result = await performAdminActionServer(action, payload, adminEmail);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
