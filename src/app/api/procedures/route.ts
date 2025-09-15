import { NextResponse } from 'next/server'
import { readProcedures } from '../../../lib/google/sheets'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const all = await readProcedures()
    const items = all.filter(p => p.is_active).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
    return NextResponse.json({ items })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch procedures', details: String(err?.message || err) }, { status: 500 })
  }
}
