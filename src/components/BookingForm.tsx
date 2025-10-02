"use client"
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import PhoneInput from './ui/PhoneInput'
import BookingSuccess from './BookingSuccess'
import BookingConsentModal from './BookingConsentModal'
import { useBookingSubmit, type Slot } from './hooks/useBookingSubmit'
import { fullDateFormatter, formatTimeRange } from '@/lib/utils/date-formatters'

type Procedure = { id: string; name_pl: string; price_pln?: number }
type ProceduresResponse = { items: Procedure[] }

export default function BookingForm({
  slot,
  procedureId,
  onSuccess,
}: {
  slot: Slot
  procedureId?: string
  onSuccess?: () => void
}) {
  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  
  // Consent state
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false)
  const [termsConsent, setTermsConsent] = useState(false)
  const [notificationsConsent, setNotificationsConsent] = useState(false)
  
  // Turnstile state
  const [tsToken, setTsToken] = useState<string | null>(null)
  const tsRef = useRef<HTMLDivElement | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string | undefined

  // Fetch procedures
  const { data: proceduresData } = useQuery<ProceduresResponse>({
    queryKey: ['procedures'],
    queryFn: () => fetch('/api/procedures').then(r => r.json() as Promise<ProceduresResponse>),
  })

  const selectedProcedure = useMemo(() => {
    if (!procedureId) return null
    return proceduresData?.items.find(p => p.id === procedureId) ?? null
  }, [procedureId, proceduresData])

  const selectedProcedureName = selectedProcedure?.name_pl ?? null

  // Use booking submit hook
  const {
    loading,
    error,
    bookingState,
    isCheckingConsent,
    checkConsentAndProceed,
    bookWithConsents,
    resetToForm,
  } = useBookingSubmit({
    slot,
    procedureId,
    name,
    phone,
    email,
    tsToken,
    onSuccess,
  })

  // Load Turnstile widget
  useEffect(() => {
    if (!siteKey) return
    
    // Load script once
    const id = 'cf-turnstile'
    if (!document.getElementById(id)) {
      const s = document.createElement('script')
      s.id = id
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.defer = true
      document.head.appendChild(s)
    }
    
    // Render widget when available
    const iv = setInterval(() => {
      // @ts-ignore -- Turnstile render helper lacks type definitions
      const t = (window as any).turnstile
      if (t && tsRef.current) {
        try {
          tsRef.current.setAttribute('data-language', 'pl')
          t.render(tsRef.current, {
            sitekey: siteKey,
            language: 'pl',
            callback: (token: string) => setTsToken(token),
          })
          clearInterval(iv)
        } catch {}
      }
    }, 200)
    return () => clearInterval(iv)
  }, [siteKey])

  // Hide Turnstile when showing consent modal
  useEffect(() => {
    if (bookingState === 'consent' && tsRef.current) {
      tsRef.current.style.display = 'none'
    } else if (tsRef.current) {
      tsRef.current.style.display = 'block'
    }
  }, [bookingState])

  // Validation
  const canSubmit = useMemo(() => {
    const phoneDigits = phone.replace(/\D/g, '')
    const hasValidPhone = phoneDigits.length >= 9
    const basic = name.trim().length >= 2 && hasValidPhone && !loading
    return siteKey ? basic && !!tsToken : basic
  }, [name, phone, loading, siteKey, tsToken])

  // Format dates
  const startDate = useMemo(() => new Date(slot.startISO), [slot.startISO])
  const endDate = useMemo(() => new Date(slot.endISO), [slot.endISO])
  const label = formatTimeRange(startDate, endDate)
  const terminLabel = `${fullDateFormatter.format(startDate)}, ${label}`

  // Handle consent confirmation
  const handleConsentConfirm = () => {
    if (!dataProcessingConsent || !termsConsent) return
    bookWithConsents({
      dataProcessing: dataProcessingConsent,
      terms: termsConsent,
      notifications: notificationsConsent,
    })
  }

  // Handle consent back
  const handleConsentBack = () => {
    resetToForm()
    // Show Turnstile again
    if (tsRef.current) {
      tsRef.current.style.display = 'block'
    }
  }

  // Handle success close
  const handleSuccessClose = () => {
    resetToForm()
    setName('')
    setPhone('')
    setEmail('')
    setDataProcessingConsent(false)
    setTermsConsent(false)
    setNotificationsConsent(false)
  }

  // Render success state
  if (bookingState === 'success') {
    return (
      <BookingSuccess
        procedureName={selectedProcedureName}
        terminLabel={terminLabel}
        procedurePrice={selectedProcedure?.price_pln}
        onClose={handleSuccessClose}
      />
    )
  }

  // Render consent modal state
  if (bookingState === 'consent') {
    return (
      <BookingConsentModal
        procedureName={selectedProcedureName}
        terminLabel={terminLabel}
        dataProcessingConsent={dataProcessingConsent}
        termsConsent={termsConsent}
        notificationsConsent={notificationsConsent}
        onDataProcessingChange={setDataProcessingConsent}
        onTermsChange={setTermsConsent}
        onNotificationsChange={setNotificationsConsent}
        loading={loading}
        error={error}
        onBack={handleConsentBack}
        onConfirm={handleConsentConfirm}
      />
    )
  }

  // Render form input state
  return (
    <div className="space-y-3">
      <div className="text-neutral-700 dark:text-dark-muted">
        <div className="font-medium text-text dark:text-dark-text mb-0.5">{selectedProcedureName}</div>
        <div className="text-sm">{terminLabel}</div>
      </div>
      <div className="space-y-2">
        <input 
          className="w-full rounded-xl border border-border bg-white/80 px-3 py-2 dark:bg-dark-card/80 dark:border-dark-border dark:text-dark-text dark:placeholder-dark-muted" 
          placeholder="Imię i nazwisko" 
          value={name} 
          onChange={e => setName(e.target.value)}
        />
        <PhoneInput 
          value={phone} 
          onChange={setPhone} 
          placeholder="Telefon"
        />
        <input 
          className="w-full rounded-xl border border-border bg-white/80 px-3 py-2 dark:bg-dark-card/80 dark:border-dark-border dark:text-dark-text dark:placeholder-dark-muted" 
          placeholder="E-mail (opcjonalnie)" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
      </div>
      {siteKey && (
        <div className="mt-3">
          <div ref={tsRef} className="rounded-xl" />
        </div>
      )}
      {error && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
      <button 
        disabled={!canSubmit || isCheckingConsent} 
        onClick={checkConsentAndProceed} 
        className={`btn btn-primary mt-4 w-full transition-all duration-200 ${!canSubmit || isCheckingConsent ? 'opacity-60 pointer-events-none' : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'}`}
      >
        {isCheckingConsent ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Przygotowanie...</span>
          </span>
        ) : (
          'Zarezerwuj'
        )}
      </button>
    </div>
  )
}
