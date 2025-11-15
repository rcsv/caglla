import { ReactNode } from 'react'

/**
 * Profile Layout
 * 
 * Phase 2-4: Route Groups導入（v3.0.0）
 * 
 * プロフィールページ用のレイアウト
 * - ユーザープロフィール
 * - 旅程一覧（将来的）
 * - フォロワー/フォロー中一覧（将来的）
 */
export default function ProfileLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}

