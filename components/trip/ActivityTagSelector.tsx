'use client'

import { useState, useEffect } from 'react'
import { ActivityTag, PrimaryCategoryType } from '@/lib/core/types'
import { 
  ACTIVITY_CATEGORIES, 
  getActivityCategoryMaster,
  getPrimaryCategoryShortLabel,
  getSecondaryCategoryLabel,
} from '@/lib/data/activity-categories'
import { t } from '@/lib/i18n'

const NEUTRAL_SELECT_CLASSES =
  'bg-white border border-gray-200 text-gray-800 focus:ring-emerald-500 focus:border-emerald-500'

const CATEGORY_SELECT_CLASSES: Record<
  PrimaryCategoryType,
  {
    primary: string
    secondary: string
  }
> = {
  transportation: {
    primary: 'bg-sky-50 border-sky-200 text-sky-900 focus:ring-sky-500 focus:border-sky-500',
    secondary: 'bg-sky-100 border-sky-300 text-sky-900 focus:ring-sky-500 focus:border-sky-500'
  },
  shopping: {
    primary: 'bg-amber-50 border-amber-200 text-amber-900 focus:ring-amber-500 focus:border-amber-500',
    secondary: 'bg-amber-100 border-amber-300 text-amber-900 focus:ring-amber-500 focus:border-amber-500'
  },
  dining: {
    primary: 'bg-orange-50 border-orange-200 text-orange-900 focus:ring-orange-500 focus:border-orange-500',
    secondary: 'bg-orange-100 border-orange-300 text-orange-900 focus:ring-orange-500 focus:border-orange-500'
  },
  accommodation: {
    primary: 'bg-rose-50 border-rose-200 text-rose-900 focus:ring-rose-500 focus:border-rose-500',
    secondary: 'bg-rose-100 border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
  },
  exploration: {
    primary: 'bg-emerald-50 border-emerald-200 text-emerald-900 focus:ring-emerald-500 focus:border-emerald-500',
    secondary: 'bg-emerald-100 border-emerald-300 text-emerald-900 focus:ring-emerald-500 focus:border-emerald-500'
  },
  adventure: {
    primary: 'bg-teal-50 border-teal-200 text-teal-900 focus:ring-teal-500 focus:border-teal-500',
    secondary: 'bg-teal-100 border-teal-300 text-teal-900 focus:ring-teal-500 focus:border-teal-500'
  },
  entertainment: {
    primary: 'bg-violet-50 border-violet-200 text-violet-900 focus:ring-violet-500 focus:border-violet-500',
    secondary: 'bg-violet-100 border-violet-300 text-violet-900 focus:ring-violet-500 focus:border-violet-500'
  },
  culture: {
    primary: 'bg-indigo-50 border-indigo-200 text-indigo-900 focus:ring-indigo-500 focus:border-indigo-500',
    secondary: 'bg-indigo-100 border-indigo-300 text-indigo-900 focus:ring-indigo-500 focus:border-indigo-500'
  },
  wellness: {
    primary: 'bg-lime-50 border-lime-200 text-lime-900 focus:ring-lime-500 focus:border-lime-500',
    secondary: 'bg-lime-100 border-lime-300 text-lime-900 focus:ring-lime-500 focus:border-lime-500'
  },
  service: {
    primary: 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-slate-500 focus:border-slate-500',
    secondary: 'bg-slate-100 border-slate-300 text-slate-900 focus:ring-slate-500 focus:border-slate-500'
  }
}

const BASE_SELECT_CLASSES =
  'min-w-0 px-3 py-2 rounded-md shadow-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none transition'

const getPrimarySelectClasses = (category: PrimaryCategoryType | '') => {
  if (!category) {
    return `${BASE_SELECT_CLASSES} ${NEUTRAL_SELECT_CLASSES}`
  }
  return `${BASE_SELECT_CLASSES} ${CATEGORY_SELECT_CLASSES[category].primary}`
}

const getSecondarySelectClasses = (category: PrimaryCategoryType) =>
  `${BASE_SELECT_CLASSES} ${CATEGORY_SELECT_CLASSES[category].secondary}`

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
  
  // 2段階目のオプションを取得
  const secondaryOptions = primaryCategory 
    ? getActivityCategoryMaster(primaryCategory)?.secondaryCategories || []
    : []
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* 1段階目（Primary Category） */}
        <select
          value={primaryCategory}
          onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
          disabled={disabled}
          className={`${getPrimarySelectClasses(primaryCategory)} ${
            primaryCategory ? 'flex-[4] min-w-0' : 'flex-1'
          }`}
          aria-label={t('trip.schedule.activity')}
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
            className={`flex-[6] min-w-0 ${getSecondarySelectClasses(primaryCategory)}`}
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

