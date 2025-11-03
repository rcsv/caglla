'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PlannerIcon from '@/components/common/icons/PlannerIcon'
import { CalendarIcon } from '@/components/common/icons/CalendarIcon'
import { SummaryIcon } from '@/components/common/icons/SummaryIcon'
import { CloudIcon } from '@/components/common/icons/CloudIcon'
import { BookmarkIcon } from '@/components/common/icons/BookmarkIcon'
import { ClipboardIcon } from '@/components/common/icons/ClipboardIcon'
import { BackpackIcon } from '@/components/common/icons/BackpackIcon'
import { MoneyIcon } from '@/components/common/icons/MoneyIcon'
import { ClockIcon } from '@/components/common/icons/ClockIcon'
import { PieChartIcon } from '@/components/common/icons/PieChartIcon'
import { LocationIcon } from '@/components/common/icons/LocationIcon'
import { CagllaLogo } from '@/components/common/icons/CagllaLogo'
import { Trip, Day, Itinerary } from '@/lib/core/types'
import { dateUtils } from '@/lib/utils/date'
import { toDate } from '@/lib/firebase/timestamp-utils'
import { t } from '@/lib/i18n'
import PremiumButton from '@/components/ui/PremiumButton'

interface NavigationMenuProps {
  trip: Trip
  onNavigateToSection: (sectionId: string) => void
  onDayClick?: (dayId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onLogout?: () => void
}

interface MenuSection {
  id: string
  title: string
  icon: React.ReactNode
  isExpandable: boolean
  isExpanded: boolean
  children?: MenuItem[]
}

interface MenuItem {
  id: string
  title: string
  subtitle?: string
  count?: number
  icon?: React.ReactNode
  onClick: () => void
}

export default function NavigationMenu({ trip, onNavigateToSection, onDayClick, isCollapsed = false, onToggleCollapse, onLogout }: NavigationMenuProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['itinerary']))

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) params.delete(k)
      else params.set(k, v)
    })
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // メニューセクションの定義（メインエリア）
  const menuSections: MenuSection[] = [
    {
      id: 'summary',
      title: 'Summary',
      icon: <SummaryIcon className="w-5 h-5" />,
      isExpandable: true,
      isExpanded: expandedSections.has('summary'),
      children: [
        {
          id: 'weather-forecast',
          title: t('nav.weatherForecast'),
          subtitle: t('nav.weatherForecast'),
          icon: <CloudIcon className="w-4 h-4" />,
          onClick: () => onNavigateToSection('weather-forecast')
        },
        {
          id: 'reservation',
          title: t('nav.reservationTitle'),
          subtitle: t('nav.reservation'),
          icon: <BookmarkIcon className="w-4 h-4" />,
          onClick: () => onNavigateToSection('reservation')
        },
        {
          id: 'budget',
          title: t('nav.budgetTitle'),
          subtitle: t('nav.travelCost'),
          icon: <MoneyIcon className="w-4 h-4" />,
          onClick: () => onNavigateToSection('budget')
        },
        {
          id: 'activity-statistics',
          title: t('nav.activityStatisticsTitle'),
          subtitle: t('nav.activityStats'),
          icon: <PieChartIcon className="w-4 h-4" />,
          onClick: () => onNavigateToSection('activity-statistics')
        },
        {
          id: 'distance-summary',
          title: t('nav.distancesTitle'),
          subtitle: t('nav.totalDistance'),
          icon: <LocationIcon className="w-4 h-4" />,
          onClick: () => onNavigateToSection('distance-summary')
        }
      ]
    },
    {
      id: 'itinerary',
      title: 'Itinerary',
      icon: (
        <CalendarIcon className="w-5 h-5" />
      ),
      isExpandable: true,
      isExpanded: expandedSections.has('itinerary'),
      children: trip.days?.sort((a, b) => (a.day_number || 0) - (b.day_number || 0)).map((day: Day) => ({
        id: `day-${day.id}`,
        title: getDayTitle(day),
        subtitle: getDaySubtitle(day),
        count: day.itineraries?.length || 0,
        onClick: () => {
          updateQuery({ view: 'itinerary', day: day.id })
          onNavigateToSection(`day-${day.id}`)
          onDayClick?.(day.id)
        }
      })) || []
    },
    {
      id: 'checklist',
      title: 'Checklist',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      isExpandable: true,
      isExpanded: expandedSections.has('checklist'),
      children: [
        {
          id: 'checklist-preparing',
          title: 'Preparing',
          subtitle: t('checklist.nav.preparing.subtitle'),
          icon: <ClipboardIcon className="w-4 h-4" />,
          onClick: () => {
            updateQuery({ view: 'checklist', day: null, section: 'preparing' })
            onNavigateToSection('checklist-preparing')
          }
        },
        {
          id: 'checklist-packing',
          title: 'Packing',
          subtitle: t('checklist.nav.packing.subtitle'),
          icon: <BackpackIcon className="w-4 h-4" />,
          onClick: () => {
            updateQuery({ view: 'checklist', day: null, section: 'packing' })
            onNavigateToSection('checklist-packing')
          }
        }
      ]
    }
  ]

  // 下付きメニューアイテムの定義
  const bottomMenuItems = [
    {
      id: 'logout',
      title: 'Logout',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      onClick: () => {
        if (onLogout) {
          onLogout()
        } else {
          onNavigateToSection('settings')
        }
      }
    }
  ]

  // 日付のタイトルを生成（簡潔版）
  function getDayTitle(day: Day): string {
    let date: Date
    try {
      date = toDate(day.date)
    } catch {
      return `Day ${day.day_number}`
    }
    const month = date.getMonth() + 1
    const dayNum = date.getDate()
    const dayNames = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
    const dayName = dayNames[date.getDay()]
    
    return `${month}/${dayNum} ${dayName}`
  }

  // 日付のサブタイトルを生成（daysのdescriptionを優先）
  // 表示優先順位: place name > formatted address > itinerary title > lat,lng
  function getDaySubtitle(day: Day): string {
    if (day.description && day.description.trim()) {
      return day.description.trim()
    }
    const pickDisplay = (itinerary: Itinerary): string => {
      const name = itinerary.place_data?.name?.trim()
      if (name) return name
      const address = itinerary.place_data?.formatted_address?.trim()
      if (address) return address
      const title = itinerary.title?.trim()
      if (title) return title
      const loc = itinerary.location?.trim()
      return loc || ''
    }
    const items = (day.itineraries || [])
      .map(pickDisplay)
      .filter(Boolean)
      .slice(0, 2)

    if (items.length === 0) return ''
    if (items.length === 1) return items[0]
    return `${items[0]} → ${items[1]}${(day.itineraries?.length || 0) > 2 ? ' ...' : ''}`
  }

  function getDayColor(day: Day): string {
    let date: Date
    try {
      date = toDate(day.date)
    } catch {
      return 'text-gray-900'
    }
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 6) return 'text-blue-600'
    if (dayOfWeek === 0) return 'text-red-600'
    return 'text-gray-900'
  }

  function getMonthAbbr(dayTitle: string): string {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const match = dayTitle.match(/(\d+)\/(\d+)/)
    if (match) {
      const month = parseInt(match[1])
      return monthNames[month - 1] || 'JAN'
    }
    return 'JAN'
  }

  function getDayNumber(dayTitle: string): string {
    const match = dayTitle.match(/(\d+)\/(\d+)/)
    if (match) {
      return match[2]
    }
    return '1'
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-200 relative z-30 left-nav-shadow ${
      isCollapsed ? 'w-12' : 'w-[188px]'
    }`} style={{ maxWidth: isCollapsed ? '48px' : '188px' }}>
      {/* メニューヘッダー（ロゴ + Caglla → /home リンク） */}
      <div className={`border-b border-gray-200 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-2'}`}>
          <Link href="/home" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} text-gray-900`} title="Home">
            <CagllaLogo className={isCollapsed ? 'w-7 h-7' : 'w-7 h-7'} />
            {!isCollapsed && (
              <span className="text-base font-semibold tracking-tight font-rajdhani">Caglla</span>
            )}
          </Link>
        </div>
      </div>

      {/* メニューコンテンツ */}
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="p-2 flex-1 flex flex-col min-h-0">
          {/* ハンバーガー + Menu トグル */}
          <button
            onClick={() => onToggleCollapse && onToggleCollapse()}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 text-left hover:bg-gray-50 rounded-lg transition-colors mb-2`}
            title="Toggle menu width"
          >
            <div className={`flex items-center ${!isCollapsed ? 'gap-2' : ''}`}>
              <span className="text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </span>
              {!isCollapsed && (
                <span className="font-medium text-gray-900">Menu</span>
              )}
            </div>
          </button>
          {menuSections.map((section) => (
            <div
              key={section.id}
              className={
                section.id === 'itinerary'
                  ? 'flex-1 flex flex-col min-h-0 relative overflow-hidden bg-white zidx-left-panel'
                  : section.id === 'checklist'
                    ? 'mb-2 relative zidx-left-panel-content bg-white'
                    : 'mb-2'
              }
            >
              {/* セクションヘッダー */}
              <button
                onClick={() => {
                  toggleSection(section.id)
                  if (section.id === 'summary') {
                    updateQuery({ view: 'summary', day: null })
                  } else if (section.id === 'itinerary') {
                    updateQuery({ view: 'itinerary' })
                  } else if (section.id === 'checklist') {
                    updateQuery({ view: 'checklist', day: null })
                  }
                }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 text-left hover:bg-gray-50 rounded-lg transition-colors`}
                title={isCollapsed ? section.title : undefined}
              >
                <div className={`flex items-center ${!isCollapsed ? 'gap-2' : ''}`}>
                  <span className="text-gray-600 flex items-center justify-center w-6 h-6">{section.icon}</span>
                  {!isCollapsed && (
                    <span className="font-medium text-gray-900">{section.title}</span>
                  )}
                </div>
                {!isCollapsed && section.isExpandable && (
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      section.isExpanded ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {/* セクションの子項目 */}
              {section.isExpandable && section.isExpanded && section.children && (
                <div className={`${isCollapsed ? '' : 'ml-2 mt-1'} space-y-1 ${
                  section.id === 'itinerary' ? 'flex-1 overflow-y-auto min-h-0 scrollbar-hide bg-white' : ''
                }`}>
                  {section.children.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className={`w-full text-left transition-colors group ${
                        isCollapsed 
                          ? 'p-1 hover:bg-gray-50 rounded' 
                          : 'p-2 hover:bg-gray-50 rounded-lg'
                      }`}
                    >
                      {isCollapsed ? (
                        <div className="flex flex-col items-center space-y-1">
                          {item.id.startsWith('day-') ? (
                            <>
                              <div className="text-[9px] font-medium text-gray-600 uppercase leading-[1.1]">
                                {getMonthAbbr(item.title)}
                              </div>
                              <div className={`text-base font-light leading-[1.1] tracking-tight ${
                                getDayColor(trip.days?.find(d => d.id === item.id.replace('day-', '')) || {} as Day)
                              }`}>
                                {getDayNumber(item.title)}
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-600 flex items-center justify-center w-6 h-6 mx-auto">
                              {item.icon}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {item.icon && (
                              <span className="text-gray-600 flex-shrink-0">
                                {item.icon}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${
                                item.id.startsWith('day-') ? getDayColor(trip.days?.find(d => d.id === item.id.replace('day-', '')) || {} as Day) : 'text-gray-900'
                              }`}>
                                {item.title}
                              </div>
                              {item.subtitle && item.subtitle !== item.title && (
                                <div className="text-xs text-gray-500 truncate">
                                  {item.subtitle}
                                </div>
                              )}
                            </div>
                          </div>
                          {item.count !== undefined && item.count > 0 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {item.count}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* 下付きメニュー（Checklist & Settings） */}
      <div className={`border-t border-gray-200 space-y-1 ${isCollapsed ? 'p-1' : 'p-2'} relative zidx-left-panel-content bg-white`}>
        {bottomMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`w-full flex items-center text-left hover:bg-gray-50 rounded-lg transition-colors ${
              isCollapsed ? 'justify-center p-1' : 'gap-2 p-2'
            }`}
            title={isCollapsed ? item.title : undefined}
          >
            <span className="text-gray-600">{item.icon}</span>
            {!isCollapsed && (
              <span className="font-medium text-gray-900">{item.title}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}


