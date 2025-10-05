"use client"
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-3">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          {/* Links and Copyright in one line */}
          <div className="text-sm text-neutral-500 dark:text-dark-muted">
            <Link 
              href="/privacy" 
              className="hover:text-primary dark:hover:text-accent transition-colors"
            >
              Polityka Prywatności
            </Link>
            <span className="mx-2">•</span>
            <Link 
              href="/terms" 
              className="hover:text-primary dark:hover:text-accent transition-colors"
            >
              Regulamin
            </Link>
            <span className="mx-2">•</span>
            <Link 
              href="/support" 
              className="hover:text-primary dark:hover:text-accent transition-colors"
            >
              Wsparcie
            </Link>
            <span className="mx-4">|</span>
            <span>© 2025 Somique Beauty. Wszystkie prawa zastrzeżone.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
