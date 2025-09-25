import fs from 'node:fs'
import path from 'node:path'

(function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx <= 0) return
    const key = trimmed.slice(0, eqIdx)
    const value = trimmed.slice(eqIdx + 1)
    if (!(key in process.env)) {
      process.env[key] = value
    }
  })
})()

function usage() {
  console.log('Usage: npx tsx scripts/consent-cli.ts <command> [args...]')
  console.log('Commands:')
  console.log('  header                                 Show sheet header and first rows')
  console.log('  show <phone> <name> [email]            Run findUserConsent and log result')
  console.log('  withdraw <phone> <name> [email]        Withdraw consent and show outcome')
  console.log('  append <phone> <name> [email] [ip]     Append a consent row (debug only)')
}

function extractNameEmail(parts: string[]) {
  if (!parts.length) return { name: '', email: undefined as string | undefined }
  let email: string | undefined
  if (parts.length && parts[parts.length - 1].includes('@')) {
    email = parts.pop()
  }
  const name = parts.join(' ')
  return { name, email }
}

async function run() {
  const [, , cmd, ...rest] = process.argv
  if (!cmd) {
    usage()
    process.exit(1)
  }

  const sheetsModule = await import('../src/lib/google/sheets')

  if (cmd === 'header') {
    const { getClients } = await import('../src/lib/google/auth')
    const { config } = await import('../src/lib/env')
    const { sheets } = getClients()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.USER_CONSENTS_GOOGLE_SHEET_ID,
      range: 'A1:O40',
    })
    const rows = res.data.values ?? []
    if (!rows.length) {
      console.log('No data')
      return
    }
    const [header, ...data] = rows
    console.log('Header:', header)
    data.slice(0, 10).forEach((row, idx) => {
      console.log(idx + 1, row)
    })
    return
  }

  if (cmd === 'show') {
    if (rest.length < 2) {
      usage()
      process.exit(1)
    }
    const [phone, ...nameParts] = rest
    const { name, email } = extractNameEmail(nameParts)
    const consent = await sheetsModule.findUserConsent(phone, name, email)
    console.log('Result:', consent)
    return
  }

  if (cmd === 'withdraw') {
    if (rest.length < 2) {
      usage()
      process.exit(1)
    }
    const [phone, ...nameParts] = rest
    const { name, email } = extractNameEmail(nameParts)
    const result = await sheetsModule.withdrawUserConsent({
      phone,
      name,
      email,
      withdrawalMethod: 'debug_cli',
      requestId: `cli-${Date.now()}`,
    })
    console.log('Withdraw result:', result)
    return
  }

  if (cmd === 'append') {
    if (rest.length < 2) {
      usage()
      process.exit(1)
    }
    const [phone, ...nameParts] = rest
    let ip = '127.0.0.1'
    if (nameParts.length && /^\d+\.\d+\.\d+\.\d+$/.test(nameParts[nameParts.length - 1])) {
      ip = nameParts.pop()!
    }
    const { name, email } = extractNameEmail(nameParts)
    await sheetsModule.saveUserConsent({
      phone,
      name,
      email,
      consentPrivacyV10: true,
      consentTermsV10: true,
      consentNotificationsV10: true,
      ip,
    })
    console.log('Consent appended')
    return
  }

  usage()
  process.exit(1)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
