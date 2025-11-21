'use client'

import { Icon } from '@iconify/react'
import { t } from '@/lib/i18n'

interface HomeWelcomeRowProps {
  onOpenCreateTrip: () => void
  onOpenQuickPlan: () => void
  onOpenCreateGuide: () => void
}

export function HomeWelcomeRow({
  onOpenCreateTrip,
  onOpenQuickPlan,
  onOpenCreateGuide,
}: HomeWelcomeRowProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('home.welcome.title', 'Welcome')}
        </h1>
        <p className="text-gray-600">
          {t('home.welcome.subtitle', 'Discover and manage your travels')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCreateTrip}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Icon icon="mdi:plus-circle" className="h-5 w-5" />
          {t('home.welcome.createTrip', 'Create Trip')}
        </button>
        <button
          onClick={onOpenQuickPlan}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-indigo-200 text-indigo-600 text-sm font-semibold hover:border-indigo-300 transition-colors"
        >
          <Icon icon="mdi:calendar-edit" className="h-5 w-5" />
          {t('home.welcome.quickPlan', 'Quick Plan')}
        </button>
        <button
          onClick={onOpenCreateGuide}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-indigo-200 text-indigo-600 text-sm font-semibold hover:border-indigo-300 transition-colors"
        >
          <Icon icon="mdi:book-open-variant" className="h-5 w-5" />
          {t('home.welcome.createGuide', 'Create a Guide')}
        </button>
      </div>
    </div>
  )
}


