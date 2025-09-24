import { config } from '../env'
import { getClients } from './auth'
import {
  columnIndexToLetter,
  getConsentValues,
  hashIpPartially,
  maskEmailHash,
  maskPhoneHash,
  normalizeName,
  normalizePhoneForSheet,
  nowInWarsawISO,
  parseConsentTimestamp,
  resolveConsentColumns,
  sortMatchesByRecency,
  trimToSheetLimit,
} from './consent-utils'

export interface UserConsent {
  phone: string
  email?: string
  name: string
  consentDate: string
  ipHash: string
  consentPrivacyV10: boolean
  consentTermsV10: boolean
  consentNotificationsV10: boolean
  consentWithdrawnDate?: string
  withdrawalMethod?: string
}

type ConsentRowMatch = {
  index: number
  row: string[]
  consent: UserConsent
  isWithdrawn: boolean
  consentTimestamp: number
}

export { normalizePhoneForSheet } from './consent-utils'

export async function saveUserConsent(consent: Omit<UserConsent, 'consentDate' | 'ipHash'> & { ip: string }): Promise<void> {
  const { sheets } = getClients()

  const now = nowInWarsawISO()
  const ipHash = hashIpPartially(consent.ip)
  const normalizedPhone = normalizePhoneForSheet(consent.phone)

  const values = [[
    normalizedPhone,
    consent.email || '',
    consent.name,
    now,
    ipHash,
    consent.consentPrivacyV10 ? 'TRUE' : 'FALSE',
    consent.consentTermsV10 ? 'TRUE' : 'FALSE',
    consent.consentNotificationsV10 ? 'TRUE' : 'FALSE',
    '',
    '',
  ]]

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.USER_CONSENTS_GOOGLE_SHEET_ID,
    range: 'A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  })
}

export async function findUserConsent(phone: string, name: string, email?: string): Promise<UserConsent | null> {
  try {
    const normalizedPhone = normalizePhoneForSheet(phone)
    const normalizedName = normalizeName(name)
    const normalizedEmail = email ? email.toLowerCase().trim() : ''

    const { header, rows } = await getConsentValues()
    if (!rows.length) return null

    const columns = resolveConsentColumns(header)
    if (!columns) return null

    const matches: ConsentRowMatch[] = []

    rows.forEach((row, index) => {
      const rowPhoneRaw = row[columns.phone]?.trim() ?? ''
      const rowEmailRaw = row[columns.email]?.trim() ?? ''
      const rowNameRaw = row[columns.name]?.trim() ?? ''

      const normalizedRowPhone = normalizePhoneForSheet(rowPhoneRaw)
      const normalizedRowName = normalizeName(rowNameRaw)
      const normalizedRowEmail = rowEmailRaw.toLowerCase()

      const phoneMatch = normalizedRowPhone === normalizedPhone
      const nameMatch = normalizedRowName === normalizedName

      let emailMatch = true
      if (normalizedEmail && normalizedRowEmail) {
        emailMatch = normalizedRowEmail === normalizedEmail
      }

      if (!phoneMatch || !nameMatch || !emailMatch) return

      const consentDate = row[columns.consentDate]?.trim() ?? ''
      const consentWithdrawnDate = columns.withdrawnDate >= 0 ? row[columns.withdrawnDate]?.trim() || undefined : undefined
      const consentPrivacy = String(row[columns.privacy] || '').trim().toUpperCase() === 'TRUE'
      const consentTerms = String(row[columns.terms] || '').trim().toUpperCase() === 'TRUE'
      const notificationsIdx = columns.notifications
      const consentNotifications = notificationsIdx >= 0
        ? String(row[notificationsIdx] || '').trim().toUpperCase() === 'TRUE'
        : false

      matches.push({
        index,
        row,
        consent: {
          phone: rowPhoneRaw,
          email: rowEmailRaw || undefined,
          name: rowNameRaw,
          consentDate,
          ipHash: columns.ipHash >= 0 ? row[columns.ipHash]?.trim() ?? '' : '',
          consentPrivacyV10: consentPrivacy,
          consentTermsV10: consentTerms,
          consentNotificationsV10: consentNotifications,
          consentWithdrawnDate,
          withdrawalMethod: columns.withdrawalMethod >= 0 ? row[columns.withdrawalMethod]?.trim() || undefined : undefined,
        },
        isWithdrawn: Boolean(consentWithdrawnDate),
        consentTimestamp: parseConsentTimestamp(consentDate),
      })
    })

    if (!matches.length) return null

    const activeMatches = matches.filter(m => !m.isWithdrawn)

    if (activeMatches.length) {
      activeMatches.sort(sortMatchesByRecency)
      return activeMatches[0].consent
    }

    matches.sort(sortMatchesByRecency)
    return matches[0].consent
  } catch (err) {
    console.error('[findUserConsent] Failed to read consent', err)
    return null
  }
}

export async function findUserConsentByPhone(phone: string): Promise<UserConsent | null> {
  console.warn('⚠️ findUserConsentByPhone is deprecated, use findUserConsent(phone, name) for better security')
  return null
}

export async function hasValidConsent(phone: string, name: string, email?: string): Promise<boolean> {
  const consent = await findUserConsent(phone, name, email)
  if (!consent) return false
  if (consent.consentWithdrawnDate) return false
  return consent.consentPrivacyV10 && consent.consentTermsV10
}

interface UpdateConsentWithdrawalOptions {
  phone: string
  name: string
  email?: string
  withdrawalMethod: 'support_form' | 'manual' | string
  requestId?: string
}

type WithdrawOutcome = {
  updated: boolean
  reason?: 'NOT_FOUND' | 'MULTIPLE_MATCHES'
  incident?: string
}

export async function withdrawUserConsent(options: UpdateConsentWithdrawalOptions): Promise<WithdrawOutcome> {
  const { phone, name, email, withdrawalMethod, requestId } = options
  const normalizedPhone = normalizePhoneForSheet(phone)
  const normalizedName = normalizeName(name)
  const normalizedEmail = email?.trim().toLowerCase() ?? ''

  const { header, rows } = await getConsentValues()
  if (!rows.length) {
    console.warn('[withdrawUserConsent] No consent rows found', { requestId })
    return { updated: false, reason: 'NOT_FOUND' }
  }

  const columns = resolveConsentColumns(header)
  if (!columns) {
    console.error('[withdrawUserConsent] Cannot resolve columns', { requestId })
    return { updated: false, reason: 'NOT_FOUND' }
  }

  const matches: ConsentRowMatch[] = []

  rows.forEach((rawRow, index) => {
    const row = [...rawRow]
    const rowPhoneRaw = row[columns.phone]?.trim() ?? ''
    const rowEmailRaw = row[columns.email]?.trim().toLowerCase() ?? ''
    const rowNameRaw = row[columns.name]?.trim() ?? ''

    const phoneMatch = normalizePhoneForSheet(rowPhoneRaw) === normalizedPhone
    const nameMatch = normalizeName(rowNameRaw) === normalizedName
    const emailMatch = !normalizedEmail || !rowEmailRaw ? true : rowEmailRaw === normalizedEmail

    if (!phoneMatch || !nameMatch || !emailMatch) return

    const consentDate = row[columns.consentDate]?.trim() ?? ''
    const consentWithdrawnDate = columns.withdrawnDate >= 0 ? row[columns.withdrawnDate]?.trim() || undefined : undefined
    const consentPrivacy = String(row[columns.privacy] || '').trim().toUpperCase() === 'TRUE'
    const consentTerms = String(row[columns.terms] || '').trim().toUpperCase() === 'TRUE'
    const notificationsIdx = columns.notifications
    const consentNotifications = notificationsIdx >= 0
      ? String(row[notificationsIdx] || '').trim().toUpperCase() === 'TRUE'
      : false

    matches.push({
      index,
      row,
      consent: {
        phone: rowPhoneRaw,
        email: row[columns.email]?.trim() || undefined,
        name: rowNameRaw,
        consentDate,
        ipHash: columns.ipHash >= 0 ? row[columns.ipHash]?.trim() ?? '' : '',
        consentPrivacyV10: consentPrivacy,
        consentTermsV10: consentTerms,
        consentNotificationsV10: consentNotifications,
        consentWithdrawnDate,
        withdrawalMethod: columns.withdrawalMethod >= 0 ? row[columns.withdrawalMethod]?.trim() || undefined : undefined,
      },
      isWithdrawn: Boolean(consentWithdrawnDate),
      consentTimestamp: parseConsentTimestamp(consentDate),
    })
  })

  if (!matches.length) {
    console.warn('[withdrawUserConsent] Consent not found', {
      requestId,
      phone: maskPhoneHash(normalizedPhone),
      email: normalizedEmail ? maskEmailHash(normalizedEmail) : undefined,
      name: normalizedName,
    })
    return { updated: false, reason: 'NOT_FOUND' }
  }

  const activeConsents = matches.filter(m => {
    const hasActivePrivacy = m.consent.consentPrivacyV10
    const hasActiveTerms = m.consent.consentTermsV10
    const notWithdrawn = !m.consent.consentWithdrawnDate
    return hasActivePrivacy && hasActiveTerms && notWithdrawn
  })

  console.log('[withdrawUserConsent] Found consents:', {
    requestId,
    phone: maskPhoneHash(normalizedPhone),
    totalMatches: matches.length,
    activeConsents: activeConsents.length,
    activeConsentDetails: activeConsents.map(m => ({
      consentDate: m.consent.consentDate,
      privacy: m.consent.consentPrivacyV10,
      terms: m.consent.consentTermsV10,
      withdrawnDate: m.consent.consentWithdrawnDate || 'НЕТ',
    })),
  })

  if (activeConsents.length === 0) {
    console.warn('[withdrawUserConsent] No active consents found - already withdrawn or invalid data', {
      requestId,
      phone: maskPhoneHash(normalizedPhone),
      totalRecords: matches.length,
    })
    return { updated: false, reason: 'NOT_FOUND' }
  }

  if (activeConsents.length > 1) {
    console.error('[withdrawUserConsent] Multiple active consents found - data integrity issue', {
      requestId,
      phone: maskPhoneHash(normalizedPhone),
      activeConsents: activeConsents.length,
    })
    return { updated: false, reason: 'MULTIPLE_MATCHES' }
  }

  const target = activeConsents[0]
  const rowIndex = target.index
  const row = [...target.row]

  if (columns.privacy >= 0) row[columns.privacy] = 'FALSE'
  if (columns.terms >= 0) row[columns.terms] = 'FALSE'
  if (columns.notifications >= 0) row[columns.notifications] = 'FALSE'
  if (columns.withdrawnDate >= 0) row[columns.withdrawnDate] = nowInWarsawISO()
  if (columns.withdrawalMethod >= 0) row[columns.withdrawalMethod] = trimToSheetLimit(withdrawalMethod)

  const writableIndices = [
    columns.privacy,
    columns.terms,
    columns.notifications,
    columns.withdrawnDate,
    columns.withdrawalMethod,
  ].filter(idx => idx >= 0)

  const maxColIdx = writableIndices.length ? Math.max(...writableIndices) : columns.withdrawnDate
  const rowNumber = rowIndex + 2
  const endColumn = columnIndexToLetter(maxColIdx >= 0 ? maxColIdx : columns.withdrawnDate)
  const updateRange = `A${rowNumber}:${endColumn}${rowNumber}`

  const { sheets } = getClients()

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.USER_CONSENTS_GOOGLE_SHEET_ID,
    range: updateRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  })

  console.log('[withdrawUserConsent] Google Sheets updated successfully', {
    requestId,
    phone: maskPhoneHash(normalizedPhone),
    rowIndex: rowNumber,
  })

  return { updated: true }
}

