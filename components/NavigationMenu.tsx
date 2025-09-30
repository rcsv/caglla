'use client'

import { useState, useEffect } from 'react'
import { Trip, Day, Itinerary } from '@/lib/types'
import { dateUtils } from '@/lib/date-utils'

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
  onClick: () => void
}

export default function NavigationMenu({ trip, onNavigateToSection, onDayClick, isCollapsed = false, onToggleCollapse }: NavigationMenuProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['itinerary']))

  // メニューセクションの定義（メインエリア）
  const menuSections: MenuSection[] = [
    {
      id: 'summary',
      title: 'Summary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
      isExpandable: true,
      isExpanded: expandedSections.has('summary'),
      children: [
        {
          id: 'at-a-glance',
          title: 'At a glance',
          subtitle: '移動情報と天気予報',
          onClick: () => onNavigateToSection('at-a-glance')
        },
        {
          id: 'budget-reservation',
          title: 'Budget / Reservation',
          subtitle: '発生費用と予約情報',
          onClick: () => onNavigateToSection('budget-reservation')
        }
      ]
    },
    {
      id: 'itinerary',
      title: 'Itinerary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      isExpandable: true,
      isExpanded: expandedSections.has('itinerary'),
      children: trip.days?.map((day: Day) => ({
        id: `day-${day.id}`,
        title: getDayTitle(day),
        subtitle: getDaySubtitle(day),
        count: day.itineraries?.length || 0,
        onClick: () => {
          onNavigateToSection(`day-${day.id}`)
          onDayClick?.(day.id)
        }
      })) || []
    }
  ]

  // 下付きメニューアイテムの定義
  const bottomMenuItems = [
    {
      id: 'checklist',
      title: 'Checklist',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => onNavigateToSection('checklist')
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => onNavigateToSection('settings')
    }
  ]

  // 日付のタイトルを生成（簡潔版）
  function getDayTitle(day: Day): string {
    const date = new Date(day.date)
    const month = date.getMonth() + 1
    const dayNum = date.getDate()
    const dayNames = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
    const dayName = dayNames[date.getDay()]
    
    return `${month}/${dayNum} ${dayName}`
  }

  // 日付のサブタイトルを生成（daysのdescriptionを優先）
  function getDaySubtitle(day: Day): string {
    // daysのdescriptionがある場合はそれを優先的に表示
    if (day.description && day.description.trim()) {
      return day.description.trim()
    }
    
    // descriptionがない場合は、最初の2つのitineraryの場所を取得して矢印で繋ぐ
    const locations = day.itineraries?.slice(0, 2).map(itinerary => {
      return itinerary.location || itinerary.place_data?.name || ''
    }).filter(Boolean) || []
    
    if (locations.length === 0) return ''
    if (locations.length === 1) return locations[0]
    
    return `${locations[0]} → ${locations[1]}${locations.length > 2 ? ' ...' : ''}`
  }

  // 曜日の色を取得
  function getDayColor(day: Day): string {
    const date = new Date(day.date)
    const dayOfWeek = date.getDay()
    
    if (dayOfWeek === 6) return 'text-blue-600' // 土曜日
    if (dayOfWeek === 0) return 'text-red-600'   // 日曜日
    return 'text-gray-900'                       // 平日
  }

  // 月の略語を取得（折りたたみ時用）
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

  // 日付の数字を取得（折りたたみ時用）
  function getDayNumber(dayTitle: string): string {
    const match = dayTitle.match(/(\d+)\/(\d+)/)
    if (match) {
      return match[2] // 日付の部分
    }
    return '1'
  }


  // セクションの展開/折りたたみを切り替え
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
      {/* メニューヘッダー */}
      <div className={`border-b border-gray-200 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900 truncate" title={trip.title}>
              {trip.title}
            </h2>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title={isCollapsed ? 'メニューを展開' : 'メニューを縮小'}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* メニューコンテンツ */}
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="p-2 flex-1 flex flex-col min-h-0">
          {menuSections.map((section) => (
            <div key={section.id} className={`${section.id === 'itinerary' ? 'flex-1 flex flex-col min-h-0' : 'mb-2'}`}>
              {/* セクションヘッダー */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                title={isCollapsed ? section.title : undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{section.icon}</span>
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
                <div className={`${isCollapsed ? '' : 'ml-6 mt-1'} space-y-1 ${
                  section.id === 'itinerary' ? 'flex-1 overflow-y-auto min-h-0 scrollbar-hide' : ''
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
                        // 折りたたみ時のコンパクト表示
                        <div className="flex flex-col items-center space-y-1">
                          <div className="text-[9px] font-medium text-gray-600 uppercase leading-[1.1]">
                            {getMonthAbbr(item.title)}
                          </div>
                          <div className={`text-base font-light leading-[1.1] tracking-tight ${
                            item.id.startsWith('day-') ? getDayColor(trip.days?.find(d => d.id === item.id.replace('day-', '')) || {} as Day) : 'text-gray-900'
                          }`}>
                            {getDayNumber(item.title)}
                          </div>
                        </div>
                      ) : (
                        // 通常表示
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${
                              item.id.startsWith('day-') ? getDayColor(trip.days?.find(d => d.id === item.id.replace('day-', '')) || {} as Day) : 'text-gray-900'
                            }`}>
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-xs text-gray-500 truncate">
                                {item.subtitle}
                              </div>
                            )}
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
      <div className={`border-t border-gray-200 space-y-1 ${isCollapsed ? 'p-1' : 'p-2'}`}>
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
