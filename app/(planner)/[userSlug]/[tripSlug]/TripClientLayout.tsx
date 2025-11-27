'use client'

import { ReactNode, useState, Fragment } from 'react'
import { TripProvider, useTrip } from './TripProvider'
import NavigationMenu from '@/components/planner/NavigationMenu'
import FloatingTitleBar from '@/components/planner/FloatingTitleBar'
import { useTripUrlState } from './useTripUrlState'
import { useAuth } from '@/lib/contexts/auth'
import { useUserData } from '@/lib/contexts/user-data'
import { useRouter } from 'next/navigation'
import type { Trip } from '@/lib/core/types'

interface TripClientLayoutProps {
  trip: Trip | null
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
  children?: ReactNode
}

/**
 * TripClientLayoutContent
 * 
 * NavigationMenuとFloatingTitleBarを含むレイアウトコンテンツ
 */
function TripClientLayoutContent({
  timeline,
  map,
  social,
  children,
}: {
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
  children?: ReactNode
}) {
  const { trip, loading, error } = useTrip()
  const { user } = useAuth()
  const { removeTrip, userData } = useUserData()
  const router = useRouter()
  const { currentView, selectedDayId, setSelectedDayId, updateQuery } = useTripUrlState()
  
  const [leftNavExpanded, setLeftNavExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // tripがnullの場合、ローディングまたはエラー表示
  if (!trip) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-500">Loading trip...</div>
        </div>
      )
    }
    if (error === 'not-found') {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-500">Trip not found</div>
        </div>
      )
    }
    if (error === 'forbidden') {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-500">Access forbidden</div>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading trip...</div>
      </div>
    )
  }

  const handleLogout = async () => {
    // TODO: logout実装
    router.push('/')
  }

  const navigateToSection = (sectionId: string) => {
    // Summary view内のセクションへのナビゲーション
    if (currentView === 'summary') {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const handleDayClick = (dayId: string) => {
    if (selectedDayId === dayId) {
      setSelectedDayId(null)
      updateQuery({ sd: null, mf: 'all' })
    } else {
      setSelectedDayId(dayId)
      updateQuery({ sd: dayId, si: null, mf: 'day' })
    }
    // Itinerary viewに切り替え
    if (currentView !== 'itinerary') {
      updateQuery({ view: 'itinerary' })
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Floating Hamburger (mobile only) */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed left-0 top-[180px] zidx-left-panel inline-flex items-center justify-center w-12 h-12 rounded-r-lg bg-white border border-gray-200 shadow text-gray-700 hover:bg-gray-50"
        aria-label="Open navigation menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Left Navigation Menu - 768px以上で常に表示（lg以上でも表示） */}
      {trip && (
        <div className="hidden md:block flex-shrink-0 z-10">
          <NavigationMenu 
            trip={trip} 
            onNavigateToSection={navigateToSection}
            onDayClick={handleDayClick}
            isCollapsed={!leftNavExpanded}
            onToggleCollapse={() => setLeftNavExpanded(!leftNavExpanded)}
            onLogout={handleLogout}
          />
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden zidx-left-panel"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide Menu */}
      <nav className={`fixed top-0 left-0 h-full w-[188px] bg-white border-r border-gray-200 transform transition-transform duration-300 zidx-left-panel-content md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {trip && (
          <div className="w-full h-full overflow-hidden">
            <NavigationMenu 
              trip={trip} 
              onNavigateToSection={(sectionId) => {
                navigateToSection(sectionId)
                setMobileMenuOpen(false)
              }}
              onDayClick={(dayId) => {
                handleDayClick(dayId)
                setMobileMenuOpen(false)
              }}
              isCollapsed={false}
              onToggleCollapse={() => {}}
              onLogout={handleLogout}
            />
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Content (Timeline) */}
        <div className="flex flex-col overflow-hidden main-content-scrollable lg:flex-shrink-0">
          {/* Floating Title Bar */}
          {trip && (
            <FloatingTitleBar 
              title={trip.title} 
              accessLevel={trip.access_level === 'private' ? 'private' : 'public'} 
            />
          )}

          {/* Timeline Slot */}
          <div className="flex-1 overflow-y-auto relative scrollbar-hide main-content-shadow">
            <Fragment key="timeline-slot">{timeline}</Fragment>
            <Fragment key="children-slot">{children}</Fragment>
            <Fragment key="social-slot">{social}</Fragment>
          </div>
        </div>

        {/* Map Panel (Desktop only) - Takes remaining space */}
        <div className="hidden lg:block lg:flex-1 border-l border-gray-200 h-full overflow-hidden">
          {map}
        </div>
      </div>
    </div>
  )
}

/**
 * TripClientLayout
 * 
 * Client Componentの境界として、TripProviderを配置します。
 * Parallel Routesの各slot（timeline, map, social）にTripデータを提供します。
 */
export function TripClientLayout({
  trip,
  timeline,
  map,
  social,
  children,
}: TripClientLayoutProps) {
  return (
    <TripProvider trip={trip}>
      <TripClientLayoutContent timeline={timeline} map={map} social={social}>
        {children}
      </TripClientLayoutContent>
    </TripProvider>
  )
}

