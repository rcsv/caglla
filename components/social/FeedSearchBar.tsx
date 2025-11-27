'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { debounce } from '@/lib/utils/debounce'

interface FeedSearchBarProps {
  feedType: 'public' | 'trending' | 'following'
  onSearch?: (query: string) => void
  placeholder?: string
}

/**
 * Feed Search Bar Component
 * 
 * フィード検索機能を提供するコンポーネント
 * - デバウンス処理でAPI呼び出しを最適化
 * - URLパラメータと連動
 */
export default function FeedSearchBar({ 
  feedType, 
  onSearch,
  placeholder = '目的地、キーワードで検索...'
}: FeedSearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  // デバウンスされた検索関数
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) {
        params.set('q', query.trim())
      } else {
        params.delete('q')
      }
      params.delete('cursor') // 検索時はカーソルをリセット
      
      // 現在のパスに応じてURLを更新
      const currentPath = window.location.pathname
      router.push(`${currentPath}?${params.toString()}`)
      
      if (onSearch) {
        onSearch(query.trim())
      }
    }, 500),
    [searchParams, router, onSearch]
  )

  // 検索クエリ変更時の処理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  // 検索クリア
  const handleClear = () => {
    setSearchQuery('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('cursor')
    router.push(`${window.location.pathname}?${params.toString()}`)
    if (onSearch) {
      onSearch('')
    }
  }

  // URLパラメータの変更を監視
  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q !== searchQuery) {
      setSearchQuery(q)
    }
  }, [searchParams])

  return (
    <div className="relative mb-6">
      <div className="relative">
        <Icon 
          icon="mdi:magnify" 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="検索をクリア"
          >
            <Icon icon="mdi:close-circle" className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* 検索フィルター（オプション） */}
      {searchQuery && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <Icon icon="mdi:filter" className="h-4 w-4" />
          <span>検索中: "{searchQuery}"</span>
        </div>
      )}
    </div>
  )
}

