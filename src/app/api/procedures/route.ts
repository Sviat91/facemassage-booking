import { NextResponse } from 'next/server'
import { readProcedures } from '../../../lib/google/sheets'
import { cacheGet, cacheSet } from '../../../lib/cache'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const key = 'procedures:v1'
    let items = await cacheGet<any[]>(key)
    if (!items) {
      const all = await readProcedures()
      items = all.filter(p => p.is_active).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
      await cacheSet(key, items, 900)
    }
    const res = NextResponse.json({ items })
    res.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=30')
    return res
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch procedures', details: String(err?.message || err) }, { status: 500 })
  }
}
