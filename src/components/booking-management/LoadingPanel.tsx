"use client"

export default function LoadingPanel() {
  return (
    <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="text-center text-neutral-600 dark:text-dark-muted">
        Szukanie rezerwacji...
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="animate-pulse">
            <div className="h-16 rounded-xl bg-neutral-200 dark:bg-dark-border" />
          </div>
        ))}
      </div>
    </div>
  )
}
