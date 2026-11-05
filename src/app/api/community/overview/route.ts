import { NextRequest, NextResponse } from 'next/server';
import { getCommunityOverviewServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';
    const result = await getCommunityOverviewServer(userId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
