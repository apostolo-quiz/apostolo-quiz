import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = searchParams.get('limit') || '15';

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&addressdetails=1&limit=${limit}`;

    const res = await fetch(nominatimUrl, {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'User-Agent': 'ApostolosQuizApp/1.0 (contato@apostolosquiz.com)'
      },
      next: { revalidate: 3600 } // Cache por 1 hora
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('[API NOMINATIM SEARCH ERROR]', error);
    return NextResponse.json([]);
  }
}
