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
import { UserMenu } from '@/components/common/UserMenu'
import { Trip, Day, Itinerary } from '@/lib/core/types'
import { dateUtils } from '@/lib/utils/date'
import { toDate } from '@/lib/firebase/timestamp-utils'
import { t } from '@/lib/i18n'
import { getUserLanguage } from '@/lib/utils/language'
import PremiumButton from '@/components/ui/PremiumButton'

interface NavigationMenuProps {
  trip: Trip
  onNavigateToSection: (sectionId: string) => void
  onDayClick?: (dayId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
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

export default function NavigationMenu({ trip, onNavigateToSection, onDayClick, isCollapsed = false, onToggleCollapse }: NavigationMenuProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['itinerary']))
  const templateWithoutDates = Boolean(trip.is_template && (!trip.start_date || !trip.end_date))

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
      title: t('nav.summary'),
      icon: <SummaryIcon className="w-5 h-5" />,
      isExpandable: true,
      isExpanded: expandedSections.has('summary'),
      children: [
        // 天気予報：テンプレートモードでは非表示（日付がないため）
        ...(!trip.is_template ? [{
          id: 'weather-forecast',
          title: t('nav.weatherForecast'),
          subtitle: t('nav.weatherForecast'),
          icon: <CloudIcon className="w-4 h-4" />,
          onClick: () => {
            updateQuery({ view: 'summary', day: null })
            onNavigateToSection('weather-forecast')
          }
        }] : []),
        // 予約：テンプレートモードでは非表示（日付がないため）
        ...(!trip.is_template ? [{
          id: 'reservation',
          title: t('nav.reservationTitle'),
          subtitle: t('nav.reservation'),
          icon: <BookmarkIcon className="w-4 h-4" />,
          onClick: () => {
            updateQuery({ view: 'summary', day: null })
            onNavigateToSection('reservation')
          }
        }] : []),
        {
          id: 'budget',
          title: t('nav.budgetTitle'),
          subtitle: t('nav.travelCost'),
          icon: <MoneyIcon className="w-4 h-4" />,
          onClick: () => {
            updateQuery({ view: 'summary', day: null })
            onNavigateToSection('budget')
          }
        },
        {
          id: 'activity-statistics',
          title: t('nav.activityStatisticsTitle'),
          subtitle: t('nav.activityStats'),
          icon: <PieChartIcon className="w-4 h-4" />,
          onClick: () => {
            updateQuery({ view: 'summary', day: null })
            onNavigateToSection('activity-statistics')
          }
        },
        {
          id: 'distance-summary',
          title: t('nav.distancesTitle'),
          subtitle: t('nav.totalDistance'),
          icon: <LocationIcon className="w-4 h-4" />,
          onClick: () => {
            updateQuery({ view: 'summary', day: null })
            onNavigateToSection('distance-summary')
          }
        }
      ]
    },
    {
      id: 'itinerary',
      title: t('nav.itinerary'),
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
      title: t('nav.checklist'),
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
          title: t('checklist.nav.preparing.title'),
          subtitle: t('checklist.nav.preparing.subtitle'),
          icon: <ClipboardIcon className="w-4 h-4" />,
          onClick: () => {
            updateQuery({ view: 'checklist', day: null, section: 'preparing' })
            onNavigateToSection('checklist-preparing')
          }
        },
        {
          id: 'checklist-packing',
          title: t('checklist.nav.packing.title'),
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


  // 日付のタイトルを生成（簡潔版）
  function getDayTitle(day: Day): string {
    if (templateWithoutDates || !day.date) {
      const dayNumber =
        typeof day.day_number === 'number'
          ? day.day_number
          : (trip.days?.findIndex(d => d.id === day.id) ?? -1) + 1
      return `${t('nav.dayPrefix')} ${dayNumber > 0 ? dayNumber : ''}`.trim()
    }

    let date: Date
    try {
      date = toDate(day.date)
    } catch {
      return `${t('nav.dayPrefix')} ${day.day_number ?? ''}`.trim()
    }
    const month = date.getMonth() + 1
    const dayNum = date.getDate()
    const lang = getUserLanguage()
    const locale = lang === 'ja' ? 'ja-JP' : 'en-US'
    const dayName = date.toLocaleDateString(locale, { weekday: 'short' })
    
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
    if (templateWithoutDates) {
      return t('nav.dayAbbr')
    }
    // i18n対応: t('nav.dayPrefix')からパターンを導出
    const dayPrefix = t('nav.dayPrefix')
    const dayPattern = new RegExp(`^${dayPrefix}\\s+\\d+`, 'i')
    if (dayPattern.test(dayTitle)) {
      return t('nav.dayAbbr')
    }
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const match = dayTitle.match(/(\d+)\/(\d+)/)
    if (match) {
      const month = parseInt(match[1])
      return monthNames[month - 1] || 'JAN'
    }
    return 'JAN'
  }

  function getDayNumber(dayTitle: string, fallbackDayNumber?: number): string {
    // i18n対応: t('nav.dayPrefix')からパターンを導出
    const dayPrefix = t('nav.dayPrefix')
    const dayPattern = new RegExp(`${dayPrefix}\\s+(\\d+)`, 'i')
    const dayMatch = dayTitle.match(dayPattern)
    if (dayMatch) {
      return dayMatch[1]
    }
    const match = dayTitle.match(/(\d+)\/(\d+)/)
    if (match) {
      return match[2]
    }
    if (typeof fallbackDayNumber === 'number') {
      return String(fallbackDayNumber)
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
      {/* メニューヘッダー（Caglla ロゴ + 折りたたみ/展開ボタン） */}
      <div className={`border-b border-gray-200 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {isCollapsed ? (
          // 折りたたみ時: ロゴと展開ボタンを縦に配置
          <div className="flex flex-col items-center gap-2">
            {/* ロゴ部分 */}
            <Link
              href="/home"
              className="text-gray-900 hover:opacity-80 transition-opacity"
              title="Go to home"
              aria-label="Go to home"
            >
              <CagllaLogo className="w-6 h-6" />
            </Link>
            
            {/* 展開ボタン */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          // 展開時: ロゴと折りたたみボタンを横に配置
          <div className="flex items-center justify-between">
            {/* ロゴ部分 */}
          <Link
            href="/home"
              className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity"
              title="Go to home"
            aria-label="Go to home"
            onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onToggleCollapse?.()
              }
            }}
          >
              <CagllaLogo className="w-8 h-8" />
              <span className="text-xl font-bold font-rajdhani">Caglla</span>
            </Link>
            
            {/* 折りたたみボタン */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
        </div>
        )}
      </div>

      {/* メニューコンテンツ */}
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="p-2 flex-1 flex flex-col min-h-0">
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
                    <span className="font-semibold text-gray-900">{section.title}</span>
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
                <div className={`${isCollapsed ? '' : 'mt-1'} space-y-1 ${
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
                                {getDayNumber(
                                  item.title,
                                  trip.days?.find(d => d.id === item.id.replace('day-', ''))?.day_number
                                )}
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
                            {/* アイコン or スペーサー（親のアイコンと位置を揃える） */}
                            {item.icon ? (
                              <span className="text-gray-600 flex-shrink-0">
                                {item.icon}
                              </span>
                            ) : (
                              <span className="w-6 h-6 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-normal truncate ${
                                item.id.startsWith('day-') ? getDayColor(trip.days?.find(d => d.id === item.id.replace('day-', '')) || {} as Day) : 'text-gray-600'
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

      {/* 下付きメニュー（UserMenu） */}
      <div className={`border-t border-gray-200 ${isCollapsed ? 'p-1' : 'p-2'} relative zidx-left-panel-content bg-white`}>
        <UserMenu isCollapsed={isCollapsed} />
      </div>
    </div>
  )
}