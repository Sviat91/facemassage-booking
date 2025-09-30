"use client"
import type { BookingResult, ProcedureOption } from './types'

interface ProcedureChangeErrorPanelProps {
  booking: BookingResult
  newProcedure: ProcedureOption | null
  errorMessage: string | null
  onRetry: () => void
  onBackToResults: () => void
  onContactMaster: () => void
}

export default function ProcedureChangeErrorPanel({
  booking,
  newProcedure,
  errorMessage,
  onRetry,
  onBackToResults,
  onContactMaster,
}: ProcedureChangeErrorPanelProps) {
  return (
    <div className="space-y-4">
      {/* Error header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Nie udało się zmienić procedury
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300 mt-1">
          Wystąpił błąd podczas aktualizacji rezerwacji
        </p>
      </div>

      {/* Error details */}
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-red-800 dark:text-red-200">Obecna procedura:</span>
            <p className="text-red-900 dark:text-red-100 font-medium">{booking.procedureName}</p>
          </div>
          
          {newProcedure && (
            <div>
              <span className="text-sm font-medium text-red-800 dark:text-red-200">Próba zmiany na:</span>
              <p className="text-red-900 dark:text-red-100">{newProcedure.name_pl}</p>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-100 dark:bg-red-800/30 rounded-lg p-3 border border-red-300 dark:border-red-700">
              <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Help message */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-900/20 dark:border-amber-800">
        <div className="flex items-start space-x-2">
          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">Potrzebujesz pomocy?</p>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
              Możesz spróbować ponownie, powrócić do wyników lub skontaktować się z obsługą.
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 hover:shadow-md dark:bg-accent dark:hover:bg-accent/90"
          >
            Spróbuj ponownie
          </button>
          <button
            type="button"
            onClick={onContactMaster}
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border/50"
          >
            Kontakt z obsługą
          </button>
        </div>
        <button
          type="button"
          onClick={onBackToResults}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border/50"
        >
          Powrót do wyników
        </button>
      </div>
    </div>
  )
}
