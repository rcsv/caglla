import { ReactNode } from 'react'

/**
 * Trip Detail Page Layout with Parallel Routes
 * 
 * Phase 2-5: Parallel Routes実装（v3.0.0）
 * 
 * Parallel Routes統合レイアウト
 * - @timeline: タイムライン（TripItineraryView）
 * - @map: 地図（TripMap）
 * - @social: SNS機能（いいね・コメント）
 * 
 * Note: 既存の実装は`page.tsx`に残っており、Parallel Routesとの統合は段階的に進めます。
 * 現在は基本的な構造のみを提供します。
 */
export default function TripDetailLayout({
  children,
  timeline,
  map,
  social,
}: {
  children: ReactNode
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
}) {
  // Note: Parallel Routesは将来的に実装します
  // 現在は既存のpage.tsxが優先されます
  
  return (
    <>
      {/* 既存のpage.tsxが優先されるため、Parallel Routesは将来的に統合 */}
      {children}
    </>
  )
}
