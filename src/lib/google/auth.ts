import { google } from 'googleapis'
import { config } from '../env'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
]

let cached: ReturnType<typeof getClients> | null = null

export function getClients() {
  if (cached) return cached

  const jwt = new google.auth.JWT({
    email: config.GOOGLE_SERVICE_ACCOUNT.client_email,
    key: config.GOOGLE_SERVICE_ACCOUNT.private_key,
    scopes: SCOPES,
  })

  const calendar = google.calendar({ version: 'v3', auth: jwt })
  const sheets = google.sheets({ version: 'v4', auth: jwt })
  cached = { auth: jwt, calendar, sheets }
  return cached
}

export type GoogleClients = ReturnType<typeof getClients>

