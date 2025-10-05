"use client"
import { AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

/**
 * Page Transition wrapper
 * Enables exit animations when navigating between pages
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={pathname}>
        {children}
      </div>
    </AnimatePresence>
  )
}
