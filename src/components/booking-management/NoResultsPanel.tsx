"use client"
import { useTranslation } from 'react-i18next'

interface NoResultsPanelProps {
  onRetry: () => void
  onExtendSearch: () => void
  onContactMaster: () => void
}

export default function NoResultsPanel({ onRetry, onExtendSearch, onContactMaster }: NoResultsPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="text-center py-6">
        <div className="text-2xl mb-2">😔</div>
        <div className="text-lg font-medium text-neutral-700 dark:text-dark-text mb-2">
          {t('management.noBookingsFound')}
        </div>
        <div className="text-sm text-neutral-600 dark:text-dark-muted">
          {t('management.checkDataAndRetry')}<br/>
          {t('management.useSameDataAsBooking')}
        </div>
      </div>
      <div className="space-y-3">
        <button type="button" onClick={onRetry} className="btn btn-primary w-full">
          {t('management.checkAgain')}
        </button>
        <button type="button" onClick={onExtendSearch} className="btn btn-outline w-full">
          {t('management.extendDateRange')}
        </button>
        <button type="button" onClick={onContactMaster} className="btn btn-outline w-full">
          {t('management.contactMasterBtn')}
        </button>
      </div>
    </div>
  )
}
