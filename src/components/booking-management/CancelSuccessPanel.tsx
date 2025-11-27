"use client"
import { useTranslation } from 'react-i18next'
import { useCurrentLanguage } from '@/contexts/LanguageContext'
import type { BookingResult } from './types'

interface CancelSuccessPanelProps {
  booking: BookingResult
  onBackToResults: () => void
}

export default function CancelSuccessPanel({ booking, onBackToResults }: CancelSuccessPanelProps) {
  const { t } = useTranslation()
  const language = useCurrentLanguage()
  
  const dateLocale = language === 'uk' ? 'uk-UA' : language === 'en' ? 'en-US' : 'pl-PL'
  const dateLabel = new Intl.DateTimeFormat(dateLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(booking.startTime)

  return (
    <div className="space-y-4">
      {/* Success header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
          {t('management.cancelSuccess')}
        </h3>
        <p className="text-sm text-green-600 dark:text-green-300 mt-1">
          {t('management.cancelSuccessDesc')}
        </p>
      </div>

      {/* Booking info */}
      <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="space-y-2">
          <div className="text-sm font-medium text-green-800 dark:text-green-200">{t('management.procedure')}</div>
          <div className="text-green-900 dark:text-green-100 font-medium">{booking.procedureName}</div>
          <div className="text-sm font-medium text-green-800 dark:text-green-200 mt-2">{t('management.term')}</div>
          <div className="text-green-900 dark:text-green-100">{dateLabel}</div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex items-start space-x-2">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{t('management.cancelDone')}</p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              {t('management.cancelDoneDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onBackToResults}
          className="rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-green-700 hover:shadow-md dark:bg-green-500 dark:hover:bg-green-600"
        >
          {t('management.backToResults')}
        </button>
      </div>
    </div>
  )
}
