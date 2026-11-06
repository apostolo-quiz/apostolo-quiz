import { NextRequest, NextResponse } from 'next/server';
import { performAdminActionServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload, adminEmail } = body;

    const result = await performAdminActionServer(action, payload, adminEmail);
    const status = result.success ? 200 : result.message?.includes('Permissão negada') ? 403 : 400;
    return NextResponse.json(result, { status });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
