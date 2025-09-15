import { getClients } from './auth'
import { config } from '../env'

export type BusyInterval = { start: string; end: string } // ISO strings

export async function freeBusy(timeMin: string, timeMax: string) {
  const { calendar } = getClients()
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: 'Europe/Warsaw',
      items: [{ id: config.GOOGLE_CALENDAR_ID }],
    },
  })
  const cal = res.data.calendars?.[config.GOOGLE_CALENDAR_ID]
  const busy = (cal?.busy ?? []) as BusyInterval[]
  return busy
}

