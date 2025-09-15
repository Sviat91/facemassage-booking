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
  const [header, ...rest] = rows
  const idx = (k: string) => header.findIndex(h => String(h).trim().toLowerCase() === k)
  const gi = {
    id: idx('id'),
    name_pl: idx('name_pl'),
    name_ru: idx('name_ru'),
    category: idx('category'),
    duration_min: idx('duration_min'),
    price_pln: idx('price_pln'),
    is_active: idx('is_active'),
    order: idx('order'),
  }
  const asBool = (v: any) => String(v ?? '').trim().toLowerCase() === 'yes' || String(v ?? '').trim() === '1' || String(v ?? '').trim().toLowerCase() === 'true'
  const asNum = (v: any) => Number.parseInt(String(v ?? '').replace(/\D/g, ''), 10) || 0
  return rest.map(r => ({
    id: String(r[gi.id] ?? ''),
    name_pl: String(r[gi.name_pl] ?? ''),
    name_ru: r[gi.name_ru] ? String(r[gi.name_ru]) : undefined,
    category: r[gi.category] ? String(r[gi.category]) : undefined,
    duration_min: asNum(r[gi.duration_min] ?? 30),
    price_pln: r[gi.price_pln] != null ? asNum(r[gi.price_pln]) : undefined,
    is_active: asBool(r[gi.is_active] ?? 'Yes'),
    order: r[gi.order] != null ? asNum(r[gi.order]) : undefined,
  }))
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

