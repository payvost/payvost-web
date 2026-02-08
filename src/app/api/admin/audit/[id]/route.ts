import { NextRequest, NextResponse } from 'next/server';

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = params;
  // Placeholder audit entries
  const rows = [
    { ts: new Date().toISOString(), actor: 'system', action: 'USER_CREATED', detail: `User ${id} registered` },
    { ts: new Date(Date.now() - 86_400_000).toISOString(), actor: 'system', action: 'LOGIN', detail: 'Web session created' },
  ];
  return NextResponse.json(rows);
}
