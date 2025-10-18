'use client'

import React from 'react'
import { UnifiedIcon } from '@/components/common/icons/UnifiedIcon'
import { IconRenderer } from '@/components/common/icons/IconRenderer'

export default function IconifyTestPage() {
  const row = (label: string, icon: string) => (
    <div className="flex items-center gap-3 py-1" key={icon}>
      <div className="w-40 text-sm text-gray-600">{label}</div>
      <UnifiedIcon icon={icon} className="w-4 h-4" />
      <UnifiedIcon icon={icon} className="w-5 h-5" />
      <UnifiedIcon icon={icon} className="w-6 h-6" />
    </div>
  )

  const iconRendererRow = (label: string, iconName: string) => (
    <div className="flex items-center gap-3 py-1" key={iconName}>
      <div className="w-40 text-sm text-gray-600">{label}</div>
      <IconRenderer iconName={iconName} className="w-4 h-4" />
      <IconRenderer iconName={iconName} className="w-5 h-5" />
      <IconRenderer iconName={iconName} className="w-6 h-6" />
    </div>
  )

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">Iconify Feasibility - Direct UnifiedIcon</h1>
      <div className="space-y-2">
        {row('Train', 'tabler:train')}
        {row('Search', 'tabler:search')}
        {row('Warning', 'tabler:alert-triangle')}
        {row('Plane', 'tabler:plane')}
        {row('Hotel', 'tabler:bed')}
        {row('Dining', 'tabler:tools-kitchen-2')}
        {row('Shopping', 'tabler:shopping-bag')}
      </div>

      <h2 className="text-lg font-semibold mt-8">IconRenderer Test - All Icons</h2>
      <div className="space-y-2">
        {iconRendererRow('Train', 'train')}
        {iconRendererRow('Search', 'search')}
        {iconRendererRow('Warning', 'warning')}
        {iconRendererRow('Plane', 'airplane')}
        {iconRendererRow('Hotel', 'hotel')}
        {iconRendererRow('Dining', 'dining')}
        {iconRendererRow('Shopping', 'shopping')}
        {iconRendererRow('Backpack', 'backpack')}
        {iconRendererRow('Bookmark', 'bookmark')}
        {iconRendererRow('Calendar', 'calendar')}
        {iconRendererRow('Chart', 'chart')}
        {iconRendererRow('Clipboard', 'clipboard')}
        {iconRendererRow('Clock', 'clock')}
        {iconRendererRow('Close', 'close')}
        {iconRendererRow('Cloud', 'cloud')}
        {iconRendererRow('Collapse', 'collapse')}
        {iconRendererRow('Expand', 'expand')}
        {iconRendererRow('LightBulb', 'lightbulb')}
        {iconRendererRow('Location', 'location')}
        {iconRendererRow('Mail', 'mail')}
        {iconRendererRow('Menu', 'menu')}
        {iconRendererRow('Money', 'money')}
        {iconRendererRow('PieChart', 'piechart')}
        {iconRendererRow('Pin', 'pin')}
        {iconRendererRow('Planner', 'planner')}
        {iconRendererRow('Prohibition', 'prohibition')}
        {iconRendererRow('PublicAccess', 'publicaccess')}
        {iconRendererRow('Rocket', 'rocket')}
        {iconRendererRow('Summary', 'summary')}
        {iconRendererRow('User', 'user')}
      </div>
    </div>
  )
}


