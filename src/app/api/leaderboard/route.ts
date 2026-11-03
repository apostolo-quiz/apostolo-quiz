import { NextResponse } from 'next/server';
import { getLeaderboardServer } from '@/server/dbServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leaderboard = await getLeaderboardServer();
    return NextResponse.json({ success: true, leaderboard });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
