/**
 * データエクスポート用ヘルパー関数
 * 
 * Trip、Day、Itinerary、ReservationデータをCSV/JSON形式にエクスポートする機能を提供
 */

import type { Trip, Day, Itinerary, ReservationInfo } from '@/lib/core/types'

// ============================================================================
// JSON エクスポート
// ============================================================================

/**
 * Trip全体をJSON形式でエクスポート
 */
export function exportTripToJson(trip: Trip): string {
  const exportData = {
    trip: {
      id: trip.id,
      title: trip.title,
      slug: trip.slug,
      description: trip.description,
      destination: trip.destination,
      destination_place_id: trip.destination_place_id,
      start_date: trip.start_date,
      end_date: trip.end_date,
      status: trip.status,
      access_level: trip.access_level,
      image_url: trip.image_url,
      created_at: trip.created_at,
      updated_at: trip.updated_at,
    },
    days: trip.days?.map(day => ({
      id: day.id,
      day_number: day.day_number,
      date: day.date,
      description: day.description,
      itineraries: day.itineraries?.map(itinerary => ({
        id: itinerary.id,
        sort_number: itinerary.sort_number,
        title: itinerary.title,
        description: itinerary.description,
        location: itinerary.location,
        place_id: itinerary.place_id,
        start_time: itinerary.start_time,
        end_time: itinerary.end_time,
        timezone: itinerary.timezone,
        cost_amount: itinerary.cost_amount,
        cost_currency: itinerary.cost_currency,
        activity_tag: itinerary.activity_tag,
        reservation: itinerary.reservation,
      })),
    })),
    exported_at: new Date().toISOString(),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * 予約情報のみをJSON形式でエクスポート
 */
export function exportReservationsToJson(trip: Trip): string {
  const reservations: any[] = []

  trip.days?.forEach(day => {
    day.itineraries?.forEach(itinerary => {
      if (itinerary.reservation) {
        reservations.push({
          trip_title: trip.title,
          day_number: day.day_number,
          date: day.date,
          itinerary_title: itinerary.title,
          reservation: itinerary.reservation,
        })
      }
    })
  })

  return JSON.stringify({
    trip_title: trip.title,
    reservations,
    exported_at: new Date().toISOString(),
  }, null, 2)
}

// ============================================================================
// CSV エクスポート
// ============================================================================

/**
 * CSVエスケープ処理
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  const str = String(value)
  
  // カンマ、改行、ダブルクォートを含む場合はエスケープ
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

/**
 * 日付をフォーマット（ISO 8601形式）
 */
function formatDate(date: any): string {
  if (!date) return ''
  
  // Firestoreタイムスタンプの場合
  if (date.toDate && typeof date.toDate === 'function') {
    return date.toDate().toISOString()
  }
  
  // Date オブジェクトの場合
  if (date instanceof Date) {
    return date.toISOString()
  }
  
  // 文字列の場合
  return String(date)
}

/**
 * Trip全体をCSV形式でエクスポート（旅程一覧）
 */
export function exportTripToItineraryCSV(trip: Trip): string {
  const headers = [
    'Trip Title',
    'Day Number',
    'Date',
    'Sort Number',
    'Itinerary Title',
    'Description',
    'Location',
    'Start Time',
    'End Time',
    'Timezone',
    'Cost Amount',
    'Cost Currency',
    'Activity Tag',
    'Has Reservation',
  ]

  const rows: string[][] = [headers]

  trip.days?.forEach(day => {
    day.itineraries?.forEach(itinerary => {
      rows.push([
        escapeCsvValue(trip.title),
        escapeCsvValue(day.day_number),
        escapeCsvValue(formatDate(day.date)),
        escapeCsvValue(itinerary.sort_number),
        escapeCsvValue(itinerary.title),
        escapeCsvValue(itinerary.description),
        escapeCsvValue(itinerary.location),
        escapeCsvValue(itinerary.start_time),
        escapeCsvValue(itinerary.end_time),
        escapeCsvValue(itinerary.timezone),
        escapeCsvValue(itinerary.cost_amount),
        escapeCsvValue(itinerary.cost_currency),
        escapeCsvValue(itinerary.activity_tag),
        escapeCsvValue(itinerary.reservation ? 'Yes' : 'No'),
      ])
    })
  })

  return rows.map(row => row.join(',')).join('\n')
}

/**
 * 予約情報のみをCSV形式でエクスポート
 */
export function exportReservationsToCSV(trip: Trip): string {
  const headers = [
    'Trip Title',
    'Day Number',
    'Date',
    'Itinerary Title',
    'Reservation Type',
    'Confirmation Number',
    'Reservation Site',
    'Reservation URL',
    'Start Date',
    'End Date',
    'Flight Number',
    'Departure Airport',
    'Arrival Airport',
    'Departure At',
    'Arrival At',
    'Airline',
    'Notes',
  ]

  const rows: string[][] = [headers]

  trip.days?.forEach(day => {
    day.itineraries?.forEach(itinerary => {
      if (itinerary.reservation) {
        const res = itinerary.reservation as ReservationInfo
        rows.push([
          escapeCsvValue(trip.title),
          escapeCsvValue(day.day_number),
          escapeCsvValue(formatDate(day.date)),
          escapeCsvValue(itinerary.title),
          escapeCsvValue(res.type),
          escapeCsvValue(res.confirmation_number),
          escapeCsvValue(res.reservation_site),
          escapeCsvValue(res.reservation_url),
          escapeCsvValue(formatDate(res.start_date)),
          escapeCsvValue(formatDate(res.end_date)),
          escapeCsvValue(res.flight_number),
          escapeCsvValue(res.departure_airport),
          escapeCsvValue(res.arrival_airport),
          escapeCsvValue(formatDate(res.departure_at)),
          escapeCsvValue(formatDate(res.arrival_at)),
          escapeCsvValue(res.airline),
          escapeCsvValue(res.notes),
        ])
      }
    })
  })

  return rows.map(row => row.join(',')).join('\n')
}

// ============================================================================
// ダウンロードヘルパー
// ============================================================================

/**
 * ブラウザでファイルをダウンロード
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Trip全体をJSON形式でダウンロード
 */
export function downloadTripAsJson(trip: Trip) {
  const content = exportTripToJson(trip)
  const filename = `${trip.slug || trip.id}_trip.json`
  downloadFile(content, filename, 'application/json')
}

/**
 * Trip全体をCSV形式でダウンロード
 */
export function downloadTripAsCSV(trip: Trip) {
  const content = exportTripToItineraryCSV(trip)
  const filename = `${trip.slug || trip.id}_itinerary.csv`
  downloadFile(content, filename, 'text/csv;charset=utf-8')
}

/**
 * 予約情報をJSON形式でダウンロード
 */
export function downloadReservationsAsJson(trip: Trip) {
  const content = exportReservationsToJson(trip)
  const filename = `${trip.slug || trip.id}_reservations.json`
  downloadFile(content, filename, 'application/json')
}

/**
 * 予約情報をCSV形式でダウンロード
 */
export function downloadReservationsAsCSV(trip: Trip) {
  const content = exportReservationsToCSV(trip)
  const filename = `${trip.slug || trip.id}_reservations.csv`
  downloadFile(content, filename, 'text/csv;charset=utf-8')
}

