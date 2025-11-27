'use client'

import { Icon } from '@iconify/react'
import { t } from '@/lib/i18n'

interface GuideCreatorHeaderProps {
  onOpenCreateGuide: () => void
}

/**
 * ガイド作成者ヘッダーコンポーネント
 * 
 * 新規ガイド作成ボタンを表示します。
 * 
 * @remarks
 * 将来のコレクション分離時も、このコンポーネントはそのまま使用可能です。
 */
export function GuideCreatorHeader({ onOpenCreateGuide }: GuideCreatorHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('tripGuide.header.title', 'ガイド作成者ダッシュボード')}
          </h1>
          <p className="text-gray-600">
            {t('tripGuide.header.subtitle', 'ガイドの作成、管理、統計を一箇所で')}
          </p>
        </div>
        <button
          onClick={onOpenCreateGuide}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Icon icon="mdi:book-plus-outline" className="h-5 w-5" />
          {t('tripGuide.header.createGuide', '新規ガイドを作成')}
        </button>
      </div>
    </div>
  )
}

