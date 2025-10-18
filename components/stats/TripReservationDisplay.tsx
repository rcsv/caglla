'use client'

import React from 'react'
import { Itinerary, ReservationInfo } from '@/lib/core/types'
import { getReservationTypeLabel } from '@/lib/utils/reservation-utils'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { UnifiedIcon } from '@/components/common/icons/UnifiedIcon'
import { placesApiHelpers } from '@/lib/api/google/places'
import Card from '@/components/common/Card'

interface TripReservationDisplayProps {
  itineraries: Itinerary[]
  className?: string
}

export default function TripReservationDisplay({ 
  itineraries, 
  className = '' 
}: TripReservationDisplayProps) {
  // 予約情報があるItineraryをフィルタリング
  const reservations = itineraries
    .filter(itinerary => itinerary.reservation)
    .map(itinerary => ({
      itinerary,
      reservation: itinerary.reservation!
    }))

  if (reservations.length === 0) {
    return (
      <Card 
        title={
          <div className="text-lg font-medium text-gray-800 flex items-center">
            <IconRenderer iconName="reservation" className="w-5 h-5 mr-2" color="#8B5CF6" />
            予約情報
          </div>
        } 
        className={className}
      >
        <div className="text-center py-4 text-gray-500">
          <IconRenderer iconName="reservation" className="w-8 h-8 mx-auto mb-2" color="#9CA3AF" />
          <p>予約情報がありません</p>
          <p className="text-sm">Itineraryに予約情報を追加してください</p>
        </div>
      </Card>
    )
  }

  // 予約タイプ別にグループ化
  const reservationsByType = reservations.reduce((acc, { itinerary, reservation }) => {
    const type = reservation.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push({ itinerary, reservation })
    return acc
  }, {} as Record<string, Array<{ itinerary: Itinerary; reservation: ReservationInfo }>>)

  // 予約タイプ → Iconify 名のマッピング
  const iconifyByType: Record<string, string> = {
    flight: 'tabler:plane',
    rental_car: 'tabler:car',
    hotel: 'tabler:bed',
    dining: 'tabler:tools-kitchen-2',
    other: 'tabler:bookmark',
  }

  const formatDateTime = (date: any): string => {
    if (!date) return ''
    try {
      const d = new Date((date as any).toDate?.() ?? (date as string))
      if (isNaN(d.getTime())) return ''
      return d.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return ''
    }
  }

  // 時刻表示ルールに基づくフォーマット関数
  const formatTimeWithRule = (startDate: any, endDate: any): { start: string; end: string } => {
    if (!startDate) return { start: '', end: '' }
    
    try {
      const start = new Date((startDate as any).toDate?.() ?? (startDate as string))
      const end = endDate ? new Date((endDate as any).toDate?.() ?? (endDate as string)) : null
      
      if (isNaN(start.getTime())) return { start: '', end: '' }
      
      // 開始時刻のフォーマット（常に表示）
      const startFormatted = start.toLocaleString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      if (!end || isNaN(end.getTime())) {
        return { start: startFormatted, end: '' }
      }
      
      // 終了時刻の表示ルール
      const startYear = start.getFullYear()
      const startMonth = start.getMonth()
      const startDay = start.getDate()
      
      const endYear = end.getFullYear()
      const endMonth = end.getMonth()
      const endDay = end.getDate()
      
      let endFormatted = ''
      
      if (startYear === endYear && startMonth === endMonth && startDay === endDay) {
        // 同じ日: 時刻のみ
        endFormatted = end.toLocaleString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        })
      } else if (startYear === endYear && startMonth === endMonth) {
        // 同じ月: 日付と時刻
        endFormatted = end.toLocaleString('ja-JP', {
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else if (startYear === endYear) {
        // 同じ年: 月・日・時刻
        endFormatted = end.toLocaleString('ja-JP', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        // 異なる年: 年・月・日・時刻
        endFormatted = end.toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      
      return { start: startFormatted, end: endFormatted }
    } catch {
      return { start: '', end: '' }
    }
  }

  const formatTime = (date: any): string => {
    if (!date) return ''
    try {
      const d = new Date((date as any).toDate?.() ?? (date as string))
      if (isNaN(d.getTime())) return ''
      return d.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return ''
    }
  }

  return (
    <Card 
      title={
        <div className="text-lg font-medium text-gray-800 flex items-center">
          <IconRenderer iconName="reservation" className="w-5 h-5 mr-2" color="#8B5CF6" />
          予約情報 ({reservations.length}件)
        </div>
      } 
      className={className}
    >
      <div className="space-y-6">
        {Object.entries(reservationsByType).map(([type, typeReservations]) => (
          <div key={type}>
            <div className="flex items-center mb-4">
              <UnifiedIcon icon={iconifyByType[type as string] || 'tabler:calendar-check'} className="w-5 h-5 mr-2 text-gray-700" />
              <h4 className="text-lg font-semibold text-gray-700">{getReservationTypeLabel(type as any)}</h4>
              <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {typeReservations.length}件
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {typeReservations.map(({ itinerary, reservation }) => {
                // 時刻表示ルールを適用
                const timeInfo = type === 'flight' 
                  ? formatTimeWithRule(reservation.departure_at, reservation.arrival_at)
                  : formatTimeWithRule(reservation.start_date, reservation.end_date)
                const photoRef = itinerary.place_data?.photos?.[0]?.photo_reference
                
                return (
                <div key={itinerary.id} className="w-[220px] bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  {/* カードヘッダー（画像付き） */}
                  <div className="relative h-24 bg-gray-200">
                    {photoRef ? (
                      <img
                        src={placesApiHelpers.getPhotoUrl(photoRef, 400)}
                        alt={itinerary.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <UnifiedIcon icon={iconifyByType[type as string] || 'tabler:calendar-check'} className="w-7 h-7 text-white/90" />
                      </div>
                    )}
                    {/* オーバーレイ */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
                    {/* オーバーレイ情報 */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <h5 className="font-semibold text-white text-sm truncate drop-shadow-sm">{itinerary.title}</h5>
                      {itinerary.location && (
                        <p className="text-xs text-white/90 truncate drop-shadow-sm">{itinerary.location}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* カードボディ */}
                  <div className="p-3 space-y-2">
                    {/* 時刻情報（強調表示） */}
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">
                        {timeInfo.start}
                      </div>
                      {timeInfo.end && (
                        <div className="text-xs text-gray-600">
                          〜 {timeInfo.end}
                        </div>
                      )}
                    </div>
                    
                    {/* 予約詳細（コンパクト表示） */}
                    <div className="space-y-1">
                      {type === 'flight' && (
                        <>
                          {reservation.flight_number && (
                            <div className="text-xs text-center">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                {reservation.flight_number}
                              </span>
                            </div>
                          )}
                          {reservation.departure_airport && reservation.arrival_airport && (
                            <div className="text-xs text-center text-gray-600">
                              {reservation.departure_airport} → {reservation.arrival_airport}
                            </div>
                          )}
                        </>
                      )}
                      
                      {reservation.confirmation_number && (
                        <div className="text-xs text-center">
                          <span className="font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {reservation.confirmation_number}
                          </span>
                        </div>
                      )}
                      
                      {reservation.reservation_site && (
                        <div className="text-xs text-center text-gray-600">
                          {reservation.reservation_site}
                        </div>
                      )}
                    </div>
                    
                    {/* メモ（1行制限） */}
                    {reservation.notes && (
                      <div className="text-xs">
                        <div className="text-gray-600 bg-gray-50 p-2 rounded text-xs line-clamp-1">
                          {reservation.notes}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* カードフッター */}
                  {reservation.reservation_url && (
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                      <a
                        href={reservation.reservation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        <IconRenderer iconName="link" className="w-3 h-3 mr-1" />
                        予約サイト
                      </a>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
