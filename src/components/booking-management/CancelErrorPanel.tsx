"use client"
import { useTranslation } from 'react-i18next'
import type { BookingResult } from './types'

interface CancelErrorPanelProps {
  booking: BookingResult | null
  errorMessage: string | null
  onBackToResults: () => void
  onTryAgain: () => void
  onContactMaster?: () => void
}

export default function CancelErrorPanel({ booking, errorMessage, onBackToResults, onTryAgain, onContactMaster }: CancelErrorPanelProps) {
  const { t } = useTranslation()
  const dateLabel = booking
    ? new Intl.DateTimeFormat('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(booking.startTime)
    : null

  const isRateLimited = typeof errorMessage === 'string' && /429|too many|limit/i.test(errorMessage)

  return (
    <div className="space-y-4">
      {/* Error header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
          {t('management.cancelFailed')}
        </h3>
        {errorMessage ? (
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            {errorMessage}
          </p>
        ) : null}
      </div>

      {/* Booking info (optional) */}
      {booking ? (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="space-y-2">
            <div className="text-sm font-medium text-red-800 dark:text-red-200">{t('management.treatmentLabel')}</div>
            <div className="text-red-900 dark:text-red-100 font-medium">{booking.procedureName}</div>
            <div className="text-sm font-medium text-red-800 dark:text-red-200 mt-2">{t('management.term')}</div>
            <div className="text-red-900 dark:text-red-100">{dateLabel}</div>
          </div>
        </div>
      ) : null}

      {/* Guidance */}
      {isRateLimited ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="text-sm text-amber-800 dark:text-amber-200">
            {t('management.tooManyAttempts')}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            {t('management.ifProblemPersists')}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onTryAgain}
          className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 hover:shadow-md dark:bg-red-500 dark:hover:bg-red-400"
        >
          {t('management.tryAgain')}
        </button>
        <button
          type="button"
          onClick={onBackToResults}
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border/50 dark:hover:border-dark-border/80"
        >
          {t('management.backToResults')}
        </button>
      </div>

      {onContactMaster ? (
        <div className="text-center">
          <button
            type="button"
            onClick={onContactMaster}
            className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-dark-muted dark:hover:text-dark-text"
          >
            {t('management.contactMaster')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
