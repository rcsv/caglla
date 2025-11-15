import { ReactNode } from 'react'
import TripPageLayout from '@/components/trip/TripPageLayout'
import type { Trip } from '@/lib/core/types'

/**
 * Trip Detail Page Layout with Parallel Routes
 * 
 * Phase 2-5: Parallel Routes実装（v3.0.0）
 * 
 * Parallel Routes統合レイアウト
 * - @timeline: タイムライン（TripItineraryView）
 * - @map: 地図（TripMap）
 * - @social: SNS機能（いいね・コメント）
 */
export default async function TripDetailLayout({
  children,
  timeline,
  map,
  social,
  params,
}: {
  children: ReactNode
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
  params: Promise<{ userSlug: string; tripSlug: string }>
}) {
  const { userSlug, tripSlug } = await params
  
  // Note: Trip data should be fetched in page.tsx or passed via context
  // For now, we'll use a placeholder layout structure
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Timeline Panel */}
        <div className="flex-1 overflow-y-auto">
          {timeline}
        </div>
        
        {/* Map Panel (Right Side - Desktop) */}
        <div className="hidden lg:block lg:w-1/2 xl:w-2/5 border-l border-gray-200">
          {map}
        </div>
      </div>
      
      {/* Social Panel (Bottom - Mobile, Side - Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 lg:fixed lg:right-0 lg:top-0 lg:bottom-0 lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white zidx-popup-menu">
        {social}
      </div>
    </div>
  )
}

