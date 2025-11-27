'use client'

import { Icon } from '@iconify/react'
import { t } from '@/lib/i18n'

type TabType = 'draft' | 'published' | 'analytics'

interface GuideTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

/**
 * ガイドタブコンポーネント
 * 
 * 執筆中、公開済み、統計の3つのタブを表示します。
 * 
 * @remarks
 * 将来のコレクション分離時も、このコンポーネントはそのまま使用可能です。
 */
export function GuideTabs({ activeTab, onTabChange }: GuideTabsProps) {
  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    {
      id: 'draft',
      label: t('tripGuide.tabs.draft', '執筆中'),
      icon: 'mdi:book-edit-outline',
    },
    {
      id: 'published',
      label: t('tripGuide.tabs.published', '公開済み'),
      icon: 'mdi:book-open-variant',
    },
    {
      id: 'analytics',
      label: t('tripGuide.tabs.analytics', '統計'),
      icon: 'mdi:chart-line',
    },
  ]

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon icon={tab.icon} className="h-5 w-5" />
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

