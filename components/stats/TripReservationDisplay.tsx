'use client'

import React from 'react'
import { Itinerary, ReservationInfo } from '@/lib/core/types'
import { getReservationTypeIcon, getReservationTypeLabel } from '@/lib/utils/reservation-utils'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
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
              <span className="text-xl mr-2">{getReservationTypeIcon(type as any)}</span>
              <h4 className="text-lg font-semibold text-gray-700">{getReservationTypeLabel(type as any)}</h4>
              <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {typeReservations.length}件
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {typeReservations.map(({ itinerary, reservation }) => (
                <div key={itinerary.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  {/* カードヘッダー */}
                  <div className="p-4 border-b border-gray-100">
                    <h5 className="font-semibold text-gray-900 text-sm truncate">{itinerary.title}</h5>
                    {itinerary.location && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{itinerary.location}</p>
                    )}
                  </div>
                  
                  {/* カードボディ */}
                  <div className="p-4 space-y-3">
                    {/* 日時情報 */}
                    <div className="space-y-2">
                      {type === 'flight' ? (
                        <>
                          {reservation.departure_at && (
                            <div className="flex items-center text-xs">
                              <IconRenderer iconName="airplane" className="w-3 h-3 mr-2 text-blue-500" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-700">出発</div>
                                <div className="text-gray-600">{formatDateTime(reservation.departure_at)}</div>
                                {reservation.departure_airport && (
                                  <div className="font-mono text-xs bg-gray-100 px-1 rounded mt-1 inline-block">
                                    {reservation.departure_airport}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {reservation.arrival_at && (
                            <div className="flex items-center text-xs">
                              <IconRenderer iconName="airplane" className="w-3 h-3 mr-2 text-green-500" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-700">到着</div>
                                <div className="text-gray-600">{formatDateTime(reservation.arrival_at)}</div>
                                {reservation.arrival_airport && (
                                  <div className="font-mono text-xs bg-gray-100 px-1 rounded mt-1 inline-block">
                                    {reservation.arrival_airport}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {reservation.flight_number && (
                            <div className="flex items-center text-xs">
                              <IconRenderer iconName="airplane" className="w-3 h-3 mr-2 text-gray-500" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-700">便名</div>
                                <div className="font-mono text-gray-600">{reservation.flight_number}</div>
                                {reservation.airline && (
                                  <div className="text-gray-500 mt-1">{reservation.airline}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {reservation.start_date && (
                            <div className="flex items-center text-xs">
                              <IconRenderer iconName="clock" className="w-3 h-3 mr-2 text-blue-500" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-700">開始</div>
                                <div className="text-gray-600">{formatDateTime(reservation.start_date)}</div>
                              </div>
                            </div>
                          )}
                          {reservation.end_date && (
                            <div className="flex items-center text-xs">
                              <IconRenderer iconName="clock" className="w-3 h-3 mr-2 text-green-500" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-700">終了</div>
                                <div className="text-gray-600">{formatDateTime(reservation.end_date)}</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* 予約詳細 */}
                    <div className="space-y-2">
                      {reservation.confirmation_number && (
                        <div className="flex items-center text-xs">
                          <IconRenderer iconName="clipboard" className="w-3 h-3 mr-2 text-purple-500" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-700">確認番号</div>
                            <div className="font-mono text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded mt-1 inline-block">
                              {reservation.confirmation_number}
                            </div>
                          </div>
                        </div>
                      )}
                      {reservation.reservation_site && (
                        <div className="flex items-center text-xs">
                          <IconRenderer iconName="link" className="w-3 h-3 mr-2 text-gray-500" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-700">予約サイト</div>
                            <div className="text-gray-600">{reservation.reservation_site}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* メモ */}
                    {reservation.notes && (
                      <div className="text-xs">
                        <div className="font-medium text-gray-700 mb-1">メモ</div>
                        <div className="text-gray-600 bg-gray-50 p-2 rounded text-xs line-clamp-2">
                          {reservation.notes}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* カードフッター */}
                  {reservation.reservation_url && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <a
                        href={reservation.reservation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        <IconRenderer iconName="link" className="w-3 h-3 mr-1" />
                        予約サイトへ
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
