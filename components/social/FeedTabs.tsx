'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'

type FeedTabType = 'public' | 'trending' | 'following'

interface FeedTabsProps {
  activeTab: string
}

/**
 * Feed Tabs Component
 * 
 * Phase 2-1: フィードページ実装（v3.0.0）
 * 
 * フィードタイプのタブ切り替えUI
 */
export function FeedTabs({ activeTab }: FeedTabsProps) {
  const searchParams = useSearchParams()
  
  const tabs: { id: FeedTabType; label: string; icon: string }[] = [
    { id: 'public', label: 'Public', icon: 'mdi:earth' },
    { id: 'trending', label: 'Trending', icon: 'mdi:fire' },
    { id: 'following', label: 'Following', icon: 'mdi:account-group' },
  ]

  const createTabUrl = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    params.delete('cursor') // タブ切り替え時はカーソルをリセット
    return `/feed?${params.toString()}`
  }

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-8" aria-label="Feed tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={createTabUrl(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                transition-colors
                ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon icon={tab.icon} className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

