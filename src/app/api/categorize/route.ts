import { NextRequest, NextResponse } from 'next/server';
import { categorizeTransactions } from '@/services/categorizer';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== 'object' || !('descriptions' in body)) {
      return NextResponse.json(
        { error: 'Missing descriptions array' },
        { status: 400 }
      );
    }

    const { descriptions } = body as { descriptions: unknown };

    if (
      !Array.isArray(descriptions) ||
      !descriptions.every((d) => typeof d === 'string')
    ) {
      return NextResponse.json(
        { error: 'descriptions must be an array of strings' },
        { status: 400 }
      );
    }

    const categories = await categorizeTransactions(descriptions);
    return NextResponse.json({ categories });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
