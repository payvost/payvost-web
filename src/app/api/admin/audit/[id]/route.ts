import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  // Placeholder audit entries
  const rows = [
    { ts: new Date().toISOString(), actor: 'system', action: 'USER_CREATED', detail: `User ${id} registered` },
    { ts: new Date(Date.now() - 86_400_000).toISOString(), actor: 'system', action: 'LOGIN', detail: 'Web session created' },
  ];
  return NextResponse.json(rows);
}
