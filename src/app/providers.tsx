"use client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<QueryClient>()
  if (!clientRef.current) clientRef.current = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10 * 60 * 1000, gcTime: 15 * 60 * 1000, refetchOnWindowFocus: false },
    }
  })

  // Prefetch procedures once on mount
  useEffect(() => {
    clientRef.current!.prefetchQuery({ queryKey: ['procedures'], queryFn: () => fetch('/api/procedures').then(r => r.json()) })
  }, [])

  return <QueryClientProvider client={clientRef.current}>{children}</QueryClientProvider>
}

