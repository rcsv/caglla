import { ReactNode } from 'react'

/**
 * Planner Layout
 * 
 * Phase 2-4: Route Groups導入（v3.0.0）
 * 
 * 旅行計画ページ用のレイアウト
 * - 旅行詳細ページ
 * - エディターレイアウト
 */
export default function PlannerLayout({
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

