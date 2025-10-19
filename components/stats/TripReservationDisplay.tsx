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

  // 予約サイト → ロゴ画像URLのマッピング
  const siteLogos: Record<string, string> = {
    skyscanner: 'https://logos-world.net/wp-content/uploads/2021/08/Skyscanner-Logo.png',
    opentable: 'https://logos-world.net/wp-content/uploads/2021/08/OpenTable-Logo.png',
    expedia: 'https://logos-world.net/wp-content/uploads/2021/08/Expedia-Logo.png',
    booking_com: 'https://logos-world.net/wp-content/uploads/2021/08/Booking-Logo.png',
    agoda: 'https://logos-world.net/wp-content/uploads/2021/08/Agoda-Logo.png',
    airbnb: 'https://logos-world.net/wp-content/uploads/2021/08/Airbnb-Logo.png',
    kayak: 'https://logos-world.net/wp-content/uploads/2021/08/Kayak-Logo.png',
    tripadvisor: 'https://logos-world.net/wp-content/uploads/2021/08/TripAdvisor-Logo.png',
    tabelog: 'https://logos-world.net/wp-content/uploads/2021/08/Tabelog-Logo.png',
    hot_pepper: 'https://logos-world.net/wp-content/uploads/2021/08/HotPepper-Logo.png',
    ana: 'https://logos-world.net/wp-content/uploads/2021/08/ANA-Logo.png',
    jal: 'https://logos-world.net/wp-content/uploads/2021/08/JAL-Logo.png',
    rakuten_travel: 'https://logos-world.net/wp-content/uploads/2021/08/Rakuten-Travel-Logo.png',
    jalan: 'https://logos-world.net/wp-content/uploads/2021/08/Jalan-Logo.png',
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
                <div key={itinerary.id} className="w-[280px] bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  {/* カードヘッダー（画像付き） */}
                  <div className="relative h-28 bg-gray-200">
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
                      <h5 className="font-bold text-white text-base truncate drop-shadow-sm">{itinerary.title}</h5>
                      {/* vicinityがない場合はformatted_addressの最初の部分を使用 */}
                      {(itinerary.place_data?.vicinity || itinerary.place_data?.formatted_address) && (
                        <p className="text-xs text-white/90 truncate drop-shadow-sm">
                          {itinerary.place_data?.vicinity || 
                           itinerary.place_data?.formatted_address?.split(',')[0] || 
                           ''}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* カードボディ */}
                  <div className="p-4 space-y-3">
                    {/* 飛行機予約の特別レイアウト */}
                    {type === 'flight' ? (
                      <div className="space-y-4">
                        {/* フライト番号（最上部、大きく強調） */}
                        {reservation.flight_number && (
                          <div className="text-left">
                            <div className="text-xs text-gray-500 mb-1">Flight</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {reservation.flight_number}
                            </div>
                          </div>
                        )}
                        
                        {/* 空港コード（中央、最大サイズ） */}
                        {reservation.departure_airport && reservation.arrival_airport && (
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <div className="text-3xl font-bold text-blue-600 mb-1">
                                {reservation.departure_airport}
                              </div>
                              <div className="text-xs text-gray-500">
                                {itinerary.title}
                              </div>
                            </div>
                            
                            {/* 飛行機アイコン */}
                            <div className="mx-4">
                              <UnifiedIcon icon="tabler:plane" className="w-6 h-6 text-blue-600" />
                            </div>
                            
                            <div className="text-left">
                              <div className="text-3xl font-bold text-blue-600 mb-1">
                                {reservation.arrival_airport}
                              </div>
                              <div className="text-xs text-gray-500">
                                Destination
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* 時刻情報（下部、中サイズ） */}
                        <div className="flex justify-between">
                          <div className="text-left">
                            <div className="text-xs text-gray-500 mb-1">Departure</div>
                            <div className="text-lg font-semibold text-gray-800">
                              {timeInfo.start}
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-xs text-gray-500 mb-1">Arrival</div>
                            <div className="text-lg font-semibold text-gray-800">
                              {timeInfo.end || 'TBD'}
                            </div>
                          </div>
                        </div>
                        
                        {/* 確認番号（小さく） */}
                        {reservation.confirmation_number && (
                          <div className="text-left">
                            <div className="text-xs text-gray-500 mb-1">Confirmation</div>
                            <div className="text-sm font-mono bg-purple-100 text-purple-800 px-3 py-1 rounded">
                              {reservation.confirmation_number}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* その他の予約タイプ（従来のレイアウト） */
                      <>
                        {/* 時刻情報（最重要 - 大きく強調） */}
                        <div className="text-left">
                          <div className="text-xl font-bold text-gray-900 mb-1">
                            {timeInfo.start}
                          </div>
                          {timeInfo.end && (
                            <div className="text-sm text-gray-600">
                              〜 {timeInfo.end}
                            </div>
                          )}
                        </div>
                        
                        {/* 予約詳細（重要度に応じて階層化） */}
                        <div className="space-y-2">
                          {reservation.confirmation_number && (
                            <div className="text-left">
                              <span className="text-sm font-mono bg-purple-100 text-purple-800 px-3 py-1 rounded">
                                {reservation.confirmation_number}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* メモ（補助情報 - 小さく） */}
                        {reservation.notes && (
                          <div className="text-left">
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded line-clamp-2">
                              {reservation.notes}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* カードフッター */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    {/* 予約サイトリンクと企業名の組み合わせ */}
                    {reservation.reservation_url && (
                      <div className="space-y-2">
                        <a
                          href={reservation.reservation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          <IconRenderer iconName="link" className="w-4 h-4 mr-2" />
                          予約サイト
                        </a>
                        
                        {/* 企業名（ボタンの下、右寄せ） */}
                        {reservation.reservation_site && (
                          <div className="flex items-center justify-end">
                            {siteLogos[reservation.reservation_site] && (
                              <img
                                src={siteLogos[reservation.reservation_site]}
                                alt={reservation.reservation_site}
                                className="w-3 h-3 mr-1 object-contain opacity-70"
                                onError={(e) => {
                                  // ロゴ画像の読み込みに失敗した場合は非表示
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <span className="text-xs text-gray-400">
                              {reservation.reservation_site}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 予約サイト情報のみの場合（URLがない場合） */}
                    {!reservation.reservation_url && reservation.reservation_site && (
                      <div className="flex items-center justify-end">
                        {siteLogos[reservation.reservation_site] && (
                          <img
                            src={siteLogos[reservation.reservation_site]}
                            alt={reservation.reservation_site}
                            className="w-3 h-3 mr-1 object-contain opacity-70"
                            onError={(e) => {
                              // ロゴ画像の読み込みに失敗した場合は非表示
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <span className="text-xs text-gray-400">
                          {reservation.reservation_site}
                        </span>
                      </div>
                    )}
                  </div>
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
