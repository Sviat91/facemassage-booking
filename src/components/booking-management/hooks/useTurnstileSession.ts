import { useEffect, useRef, useState } from 'react'
import { getTurnstileTokenWithSession, storeTurnstileSession } from '../../../lib/turnstile-client'

export interface UseTurnstileSessionReturn {
  turnstileToken: string | null
  setTurnstileToken: (token: string | null) => void
  turnstileNode: { ref: React.RefObject<HTMLDivElement>; className: string } | undefined
  turnstileRequired: boolean
}

export function useTurnstileSession(siteKey?: string): UseTurnstileSessionReturn {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement | null>(null)

  // Initialize existing token from session
  useEffect(() => {
    if (!siteKey) return

    const existing = getTurnstileTokenWithSession()
    if (existing) {
      setTurnstileToken(existing)
      return
    }

    // Load Turnstile script if not present
    const scriptId = 'cf-turnstile'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    // Initialize Turnstile widget
    const interval = setInterval(() => {
      const turnstile = (window as any)?.turnstile
      if (turnstile && turnstileRef.current) {
        try {
          turnstileRef.current.innerHTML = ''
          turnstileRef.current.setAttribute('data-language', 'pl')
          turnstile.render(turnstileRef.current, {
            sitekey: siteKey,
            language: 'pl',
            callback: (token: string) => {
              setTurnstileToken(token)
              storeTurnstileSession(token)
            },
          })
          clearInterval(interval)
        } catch {
          // retry on next interval
        }
      }
    }, 200)

    return () => clearInterval(interval)
  }, [siteKey])

  const turnstileNode = siteKey 
    ? { ref: turnstileRef, className: "rounded-xl" }
    : undefined

  const turnstileRequired = !!siteKey && !turnstileToken

  return {
    turnstileToken,
    setTurnstileToken,
    turnstileNode,
    turnstileRequired,
  }
}
