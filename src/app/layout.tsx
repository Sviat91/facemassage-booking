import '../styles/globals.css'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Facemassage — Rezerwacja',
  description: 'Szybka rezerwacja wizyty. 90 dni do przodu.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
