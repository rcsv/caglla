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
      <div className="space-y-4">
        {Object.entries(reservationsByType).map(([type, typeReservations]) => (
          <div key={type} className="border-l-4 border-purple-200 pl-4">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">{getReservationTypeIcon(type as any)}</span>
              <h4 className="font-medium text-gray-700">{getReservationTypeLabel(type as any)}</h4>
              <span className="ml-2 text-sm text-gray-500">({typeReservations.length}件)</span>
            </div>
            
            <div className="space-y-2">
              {typeReservations.map(({ itinerary, reservation }) => (
                <div key={itinerary.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-800">{itinerary.title}</h5>
                      {itinerary.location && (
                        <p className="text-sm text-gray-600">{itinerary.location}</p>
                      )}
                      
                      {/* 日時情報 */}
                      <div className="mt-2 text-sm text-gray-600">
                        {type === 'flight' ? (
                          <div className="space-y-1">
                            {reservation.departure_at && (
                              <div className="flex items-center">
                                <IconRenderer iconName="airplane" className="w-4 h-4 mr-1" color="#6B7280" />
                                <span>出発: {formatDateTime(reservation.departure_at)}</span>
                                {reservation.departure_airport && (
                                  <span className="ml-2 font-mono text-xs bg-gray-200 px-1 rounded">
                                    {reservation.departure_airport}
                                  </span>
                                )}
                              </div>
                            )}
                            {reservation.arrival_at && (
                              <div className="flex items-center">
                                <IconRenderer iconName="airplane" className="w-4 h-4 mr-1" color="#6B7280" />
                                <span>到着: {formatDateTime(reservation.arrival_at)}</span>
                                {reservation.arrival_airport && (
                                  <span className="ml-2 font-mono text-xs bg-gray-200 px-1 rounded">
                                    {reservation.arrival_airport}
                                  </span>
                                )}
                              </div>
                            )}
                            {reservation.flight_number && (
                              <div className="flex items-center">
                                <IconRenderer iconName="airplane" className="w-4 h-4 mr-1" color="#6B7280" />
                                <span className="font-mono">{reservation.flight_number}</span>
                                {reservation.airline && (
                                  <span className="ml-2 text-xs">{reservation.airline}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {reservation.start_date && (
                              <div className="flex items-center">
                                <IconRenderer iconName="clock" className="w-4 h-4 mr-1" color="#6B7280" />
                                <span>開始: {formatDateTime(reservation.start_date)}</span>
                              </div>
                            )}
                            {reservation.end_date && (
                              <div className="flex items-center">
                                <IconRenderer iconName="clock" className="w-4 h-4 mr-1" color="#6B7280" />
                                <span>終了: {formatDateTime(reservation.end_date)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 予約詳細 */}
                      <div className="mt-2 space-y-1">
                        {reservation.confirmation_number && (
                          <div className="flex items-center text-sm">
                            <IconRenderer iconName="clipboard" className="w-4 h-4 mr-1" color="#6B7280" />
                            <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                              {reservation.confirmation_number}
                            </span>
                          </div>
                        )}
                        {reservation.reservation_site && (
                          <div className="flex items-center text-sm text-gray-600">
                            <IconRenderer iconName="link" className="w-4 h-4 mr-1" color="#6B7280" />
                            <span>{reservation.reservation_site}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* アクションボタン */}
                    <div className="flex flex-col space-y-1 ml-2">
                      {reservation.reservation_url && (
                        <a
                          href={reservation.reservation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                        >
                          予約サイト
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* メモ */}
                  {reservation.notes && (
                    <div className="mt-2 p-2 bg-white rounded border-l-2 border-purple-200">
                      <p className="text-sm text-gray-700">{reservation.notes}</p>
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
