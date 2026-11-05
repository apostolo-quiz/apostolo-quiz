import { NextRequest, NextResponse } from 'next/server';
import { getAdminOverviewServer } from '@/server/dbServer';
import { ADMIN_MASTER_EMAIL } from '@/data/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || '';

    // Validação de acesso administrativo
    if (email.trim().toLowerCase() !== ADMIN_MASTER_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'Acesso restrito ao Administrador do Sistema.' },
        { status: 403 }
      );
    }

    const data = await getAdminOverviewServer(email);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
