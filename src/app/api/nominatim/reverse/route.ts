import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({});
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'User-Agent': 'ApostolosQuizApp/1.0 (contato@apostolosquiz.com)'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      return NextResponse.json({});
    }

    const data = await res.json();
    return NextResponse.json(data || {});
  } catch (error) {
    console.error('[API NOMINATIM REVERSE ERROR]', error);
    return NextResponse.json({});
  }
}
