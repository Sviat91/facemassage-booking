import { NextRequest, NextResponse } from 'next/server'
import { readProcedures } from '../../../lib/google/sheets'
import { cacheGet, cacheSet } from '../../../lib/cache'
import { getLogger } from '../../../lib/logger'
import { reportError } from '../../../lib/sentry'

export const runtime = 'nodejs'

const log = getLogger({ module: 'api.procedures' })

export async function GET(req: NextRequest) {
  try {
    const masterId = req.nextUrl.searchParams.get('masterId') || undefined
    const key = `procedures:v1:${masterId || 'default'}`
    let items = await cacheGet<any[]>(key)
    if (!items) {
      log.debug({ masterId }, 'Procedures cache miss, loading from Google Sheets')
      const all = await readProcedures(masterId)
      items = all.filter(p => p.is_active).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
      await cacheSet(key, items, 900)
    }
    const res = NextResponse.json({ items })
    res.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=30')
    return res
  } catch (err: any) {
    log.error({ err }, 'Failed to fetch procedures')
    await reportError(err, { tags: { module: 'api.procedures' } })
    return NextResponse.json({ error: 'Failed to fetch procedures', details: String(err?.message || err) }, { status: 500 })
  }
}