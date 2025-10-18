'use client'

import React from 'react'
import { UnifiedIcon } from '@/components/common/icons/UnifiedIcon'

export default function IconifyTestPage() {
  const row = (label: string, icon: string) => (
    <div className="flex items-center gap-3 py-1" key={icon}>
      <div className="w-40 text-sm text-gray-600">{label}</div>
      <UnifiedIcon icon={icon} className="w-4 h-4" />
      <UnifiedIcon icon={icon} className="w-5 h-5" />
      <UnifiedIcon icon={icon} className="w-6 h-6" />
    </div>
  )

  return (
    <div className="p-6 space-y-2">
      <h1 className="text-lg font-semibold">Iconify Feasibility</h1>
      {row('Train', 'tabler:train')}
      {row('Search', 'tabler:search')}
      {row('Warning', 'tabler:alert-triangle')}
      {row('Plane', 'tabler:plane')}
      {row('Hotel', 'tabler:bed')}
      {row('Dining', 'tabler:tools-kitchen-2')}
      {row('Shopping', 'tabler:shopping-bag')}
    </div>
  )
}


