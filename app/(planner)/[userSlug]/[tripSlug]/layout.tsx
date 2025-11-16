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
  // いったん既存の page.tsx をメイン表示として維持しつつ、
  // Parallel Routes は map/social を優先的に統合し、timeline は段階移行のため枠のみ保持
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content with right map slot (desktop) */}
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 relative">
          {children}
        </div>
        {/* Map Panel (Desktop only) */}
        <div className="hidden lg:block lg:w-1/2 xl:w-2/5 border-l border-gray-200">
          {map}
        </div>
      </div>

      {/* Social Panel (Bottom on mobile, Right on desktop) */}
      <div className="fixed bottom-0 left-0 right-0 lg:fixed lg:right-0 lg:top-0 lg:bottom-0 lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white zidx-popup-menu">
        {social}
      </div>

      {/* timeline は段階移行用に枠だけ保持（現状は非表示） */}
      <div className="hidden">{timeline}</div>
    </div>
  )
}
