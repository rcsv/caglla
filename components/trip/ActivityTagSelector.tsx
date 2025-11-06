'use client'

import { useState, useEffect } from 'react'
import { ActivityTag, PrimaryCategoryType } from '@/lib/core/types'
import { 
  ACTIVITY_CATEGORIES, 
  getActivityCategoryMaster,
  getPrimaryCategoryLabel,
  getPrimaryCategoryShortLabel,
  getSecondaryCategoryLabel
} from '@/lib/data/activity-categories'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { t } from '@/lib/i18n'

interface ActivityTagSelectorProps {
  currentTag?: ActivityTag | null
  onTagChange: (tag: ActivityTag | null) => void
  disabled?: boolean
}

export default function ActivityTagSelector({
  currentTag,
  onTagChange,
  disabled = false,
}: ActivityTagSelectorProps) {
  const [primaryCategory, setPrimaryCategory] = useState<PrimaryCategoryType | ''>('')
  const [secondaryCategory, setSecondaryCategory] = useState<string>('')
  
  // 初期値の設定
  useEffect(() => {
    if (currentTag) {
      setPrimaryCategory(currentTag.primaryCategory)
      setSecondaryCategory(currentTag.secondaryCategory)
    } else {
      setPrimaryCategory('')
      setSecondaryCategory('')
    }
  }, [currentTag])
  
  // 1段階目カテゴリー変更時の処理
  const handlePrimaryCategoryChange = (value: string) => {
    const newPrimary = value as PrimaryCategoryType | ''
    setPrimaryCategory(newPrimary)
    setSecondaryCategory('') // 2段階目をリセット
    
    if (!newPrimary) {
      onTagChange(null)
    }
  }
  
  // 2段階目カテゴリー変更時の処理
  const handleSecondaryCategoryChange = (value: string) => {
    setSecondaryCategory(value)
    
    if (primaryCategory && value) {
      onTagChange({
        primaryCategory,
        secondaryCategory: value,
      })
    } else {
      onTagChange(null)
    }
  }
  
  // クリアボタン
  const handleClear = () => {
    setPrimaryCategory('')
    setSecondaryCategory('')
    onTagChange(null)
  }
  
  // 2段階目のオプションを取得
  const secondaryOptions = primaryCategory 
    ? getActivityCategoryMaster(primaryCategory)?.secondaryCategories || []
    : []
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <IconRenderer iconName="clipboard" className="w-4 h-4" color="#374151" />
          {t('trip.schedule.activity')}
        </label>
        {(primaryCategory || secondaryCategory) && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
          >
            {t('trip.schedule.clear')}
          </button>
        )}
      </div>
      
      <div className="flex gap-2">
        {/* 1段階目（Primary Category） */}
        <select
          value={primaryCategory}
          onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{t('trip.schedule.categorySelect')}</option>
          {ACTIVITY_CATEGORIES.map((category) => (
            <option key={category.primaryCategory} value={category.primaryCategory}>
              {getPrimaryCategoryShortLabel(category.primaryCategory)}
            </option>
          ))}
        </select>
        
        {/* 2段階目（Secondary Category）- 1段階目が選択されている場合のみ表示 */}
        {primaryCategory && (
          <select
            value={secondaryCategory}
            onChange={(e) => handleSecondaryCategoryChange(e.target.value)}
            disabled={disabled}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">{t('trip.schedule.categoryDetail')}</option>
            {secondaryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {getSecondaryCategoryLabel(primaryCategory, option.id)}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}

