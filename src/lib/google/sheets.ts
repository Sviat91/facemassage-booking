import { config } from '../env'
import { getClients } from './auth'

export async function readProcedures() {
  const { sheets } = getClients()
  const range = `${config.SHEET_TABS.PROCEDURES}!A1:Z1000`
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: config.GOOGLE_SHEET_ID, range })
  return parseProcedures(res.data.values ?? [])
}

type Procedure = {
  id: string
  name_pl: string
  name_ru?: string
  category?: string
  duration_min: number
  price_pln?: number
  is_active: boolean
  order?: number
}

function parseProcedures(rows: any[][]): Procedure[] {
  if (!rows.length) return []
  const [headerRaw, ...rest] = rows
  const header = headerRaw.map(h => String(h ?? '').trim().toLowerCase())

  const find = (re: RegExp) => header.findIndex(h => re.test(h))
  const gi = {
    id: find(/^id$/),
    name_pl: (() => {
      const i = find(/name.*procedure|name_pl|name|nazwa/)
      return i
    })(),
    name_ru: find(/name_ru/),
    category: find(/category|kategoria/),
    duration_min: (() => {
      const i = find(/duration|czas|min/)
      return i
    })(),
    price_pln: find(/price|pln|cena/),
    is_active: find(/is.?active|active|aktyw/),
    order: find(/order|sort/),
  }

  const asBool = (v: any) => {
    const s = String(v ?? '').trim().toLowerCase()
    return s === 'yes' || s === '1' || s === 'true' || s === 'y'
  }
  const parseDuration = (v: any) => {
    const s = String(v ?? '').trim()
    if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(s)) {
      const [h, m] = s.split(':').map(Number); return h * 60 + m
    }
    const num = parseInt(s.replace(/\D/g, ''), 10)
    return Number.isFinite(num) && num > 0 ? num : 30
  }
  const asNum = (v: any) => Number.parseInt(String(v ?? '').replace(/\D/g, ''), 10) || 0

  const out: Procedure[] = []
  rest.forEach((r, idxRow) => {
    const name = gi.name_pl >= 0 ? String(r[gi.name_pl] ?? '').trim() : ''
    const duration = gi.duration_min >= 0 ? parseDuration(r[gi.duration_min]) : 30
    if (!name) return // skip empty
    const id = (gi.id >= 0 ? String(r[gi.id] ?? '').trim() : `${name}-${duration}`).slice(0, 100)
    out.push({
      id,
      name_pl: name,
      name_ru: gi.name_ru >= 0 ? String(r[gi.name_ru] ?? '') : undefined,
      category: gi.category >= 0 ? String(r[gi.category] ?? '') : undefined,
      duration_min: duration,
      price_pln: gi.price_pln >= 0 ? asNum(r[gi.price_pln]) : undefined,
      is_active: gi.is_active >= 0 ? asBool(r[gi.is_active]) : true,
      order: gi.order >= 0 ? asNum(r[gi.order]) : idxRow + 1,
    })
  })
  return out
}

// Weekly schedule: columns like [Weekday, Working Hours, Is Day Off]
export type DayRange = { start: string; end: string }
export type WeeklyMap = Record<string, { hours: string; isDayOff: boolean }>

export async function readWeekly(): Promise<WeeklyMap> {
  const { sheets } = getClients()
  const range = `${config.SHEET_TABS.WEEKLY}!A1:Z1000`
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: config.GOOGLE_SHEET_ID, range })
  const rows = res.data.values ?? []
  if (!rows.length) return {}
  const [header, ...items] = rows
  const idx = (key: string) => header.findIndex(h => String(h).toLowerCase().includes(key))
  const gi = {
    weekday: idx('week'),
    hours: idx('work'),
    dayoff: idx('day off'),
  }
  const isYes = (v: any) => String(v ?? '').trim().toLowerCase().includes('yes') || String(v ?? '').trim() === '1' || String(v ?? '').trim().toLowerCase() === 'true'
  const norm = (s: any) => String(s ?? '').replace(/\u00A0/g, ' ').trim().toLowerCase()
  const weekly: WeeklyMap = {}
  for (const r of items) {
    const k = norm(r[gi.weekday]) // monday, ...
    if (!k) continue
    weekly[k] = {
      hours: String(r[gi.hours] ?? '').trim(),
      isDayOff: isYes(r[gi.dayoff]),
    }
  }
  return weekly
}

export type ExceptionsMap = Record<string, { hours: string; isDayOff: boolean }>

export async function readExceptions(): Promise<ExceptionsMap> {
  const { sheets } = getClients()
  const range = `${config.SHEET_TABS.EXCEPTIONS}!A1:Z1000`
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: config.GOOGLE_SHEET_ID, range })
  const rows = res.data.values ?? []
  if (!rows.length) return {}
  const [header, ...items] = rows
  const idx = (key: string) => header.findIndex(h => String(h).toLowerCase().includes(key))
  const gi = {
    date: idx('date'),
    hours: idx('work'),
    dayoff: idx('day off'),
  }
  const isYes = (v: any) => String(v ?? '').trim().toLowerCase().includes('yes') || String(v ?? '').trim() === '1' || String(v ?? '').trim().toLowerCase() === 'true'
  const normDate = (s: any) => String(s ?? '').trim().slice(0, 10)
  const ex: ExceptionsMap = {}
  for (const r of items) {
    const d = normDate(r[gi.date])
    if (!d) continue
    ex[d] = { hours: String(r[gi.hours] ?? '').trim(), isDayOff: isYes(r[gi.dayoff]) }
  }
  return ex
}
