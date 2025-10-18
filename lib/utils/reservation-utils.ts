import { ReservationInfo, ReservationType, ReservationSite } from '@/lib/core/types'

/**
 * 予約情報のバリデーション
 */
export function validateReservationInfo(reservation: Partial<ReservationInfo>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 必須フィールドのチェック
  if (!reservation.type) {
    errors.push('予約タイプは必須です')
  }

  // 予約タイプ別のバリデーション
  if (reservation.type === 'flight') {
    // 飛行機の場合
    if (!reservation.flight_number) {
      errors.push('便名は必須です')
    }
    if (!reservation.departure_airport) {
      errors.push('出発空港は必須です')
    }
    if (!reservation.arrival_airport) {
      errors.push('到着空港は必須です')
    }
    if (!reservation.departure_at) {
      errors.push('出発日時は必須です')
    }
    if (!reservation.arrival_at) {
      errors.push('到着日時は必須です')
    }
  } else if (reservation.type && ['rental_car', 'hotel', 'dining', 'other'].includes(reservation.type)) {
    // 飛行機以外の場合
    if (!reservation.start_date) {
      errors.push('開始日時は必須です')
    }
    if (!reservation.end_date) {
      errors.push('終了日時は必須です')
    }
    // 場所情報はItineraryから取得するため、ReservationInfoでは不要
  }

  // URLのバリデーション
  if (reservation.reservation_url && !isAllowedReservationUrl(reservation.reservation_url)) {
    errors.push('予約URLはhttps://で始まる有効なURLである必要があります')
  }

  // 日時の論理チェック
  if (reservation.start_date && reservation.end_date) {
    const startTime = (reservation.start_date instanceof Date ? reservation.start_date : typeof reservation.start_date === 'string' ? new Date(reservation.start_date) : reservation.start_date.toDate()).getTime()
    const endTime = (reservation.end_date instanceof Date ? reservation.end_date : typeof reservation.end_date === 'string' ? new Date(reservation.end_date) : reservation.end_date.toDate()).getTime()
    if (startTime >= endTime) {
      errors.push('終了日時は開始日時より後である必要があります')
    }
  }

  if (reservation.departure_at && reservation.arrival_at) {
    const departureTime = (reservation.departure_at instanceof Date ? reservation.departure_at : typeof reservation.departure_at === 'string' ? new Date(reservation.departure_at) : reservation.departure_at.toDate()).getTime()
    const arrivalTime = (reservation.arrival_at instanceof Date ? reservation.arrival_at : typeof reservation.arrival_at === 'string' ? new Date(reservation.arrival_at) : reservation.arrival_at.toDate()).getTime()
    if (departureTime >= arrivalTime) {
      errors.push('到着日時は出発日時より後である必要があります')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 許可された予約サイトURLかチェック
 */
export function isAllowedReservationUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    
    // HTTPS のみ許可
    if (parsedUrl.protocol !== 'https:') {
      return false
    }

    // 許可されたドメインのリスト
    const allowedDomains = [
      'expedia.com',
      'booking.com',
      'agoda.com',
      'trivago.com',
      'airbnb.com',
      'kayak.com',
      'skyscanner.com',
      'tripadvisor.com',
      'opentable.com',
      'tabelog.com',
      'hotpepper.jp',
      'ana.co.jp',
      'jal.co.jp',
      'travel.rakuten.co.jp',
      'jalan.net'
    ]

    // ドメインが許可リストに含まれているかチェック
    const hostname = parsedUrl.hostname.toLowerCase()
    return allowedDomains.some(domain => hostname.includes(domain))
  } catch {
    return false
  }
}

/**
 * 予約タイプの日本語表示名を取得
 */
export function getReservationTypeLabel(type: ReservationType): string {
  const labels: Record<ReservationType, string> = {
    flight: '飛行機',
    rental_car: 'レンタカー',
    hotel: 'ホテル',
    dining: '食事',
    other: 'その他'
  }
  return labels[type] || type
}

/**
 * 予約サイトの日本語表示名を取得
 */
export function getReservationSiteLabel(site: ReservationSite): string {
  const labels: Record<ReservationSite, string> = {
    expedia: 'Expedia',
    booking_com: 'Booking.com',
    agoda: 'Agoda',
    trivago: 'Trivago',
    airbnb: 'Airbnb',
    kayak: 'Kayak',
    skyscanner: 'Skyscanner',
    tripadvisor: 'TripAdvisor',
    opentable: 'OpenTable',
    tabelog: '食べログ',
    hot_pepper: 'ホットペッパー',
    ana: 'ANA',
    jal: 'JAL',
    rakuten_travel: '楽天トラベル',
    jalan: 'じゃらん',
    other: 'その他'
  }
  return labels[site] || site
}

/**
 * 予約タイプのアイコンを取得
 */
export function getReservationTypeIcon(type: ReservationType): string {
  const icons: Record<ReservationType, string> = {
    flight: '✈️',
    rental_car: '🚗',
    hotel: '🏨',
    dining: '🍽️',
    other: '📋'
  }
  return icons[type] || '📋'
}

/**
 * 空港コードのバリデーション
 */
export function validateAirportCode(code: string): boolean {
  // 3文字の英大文字のみ許可
  return /^[A-Z]{3}$/.test(code)
}

/**
 * 便名のバリデーション
 */
export function validateFlightNumber(flightNumber: string): boolean {
  // 航空会社コード（2-3文字）+ 数字（1-4桁）の形式
  return /^[A-Z]{2,3}[0-9]{1,4}$/.test(flightNumber)
}

/**
 * 予約情報のサマリーを生成（場所名は外部から提供）
 */
export function generateReservationSummary(reservation: ReservationInfo, placeName?: string): string {
  if (reservation.type === 'flight') {
    const flightNumber = reservation.flight_number || ''
    const departure = reservation.departure_airport || ''
    const arrival = reservation.arrival_airport || ''
    return `${flightNumber} ${departure}→${arrival}`
  } else {
    const name = placeName || '場所未設定'
    const startDate = reservation.start_date ? (reservation.start_date instanceof Date ? reservation.start_date : typeof reservation.start_date === 'string' ? new Date(reservation.start_date) : reservation.start_date.toDate()).toLocaleDateString('ja-JP') : ''
    const endDate = reservation.end_date ? (reservation.end_date instanceof Date ? reservation.end_date : typeof reservation.end_date === 'string' ? new Date(reservation.end_date) : reservation.end_date.toDate()).toLocaleDateString('ja-JP') : ''
    
    if (startDate && endDate) {
      return `${name} (${startDate} - ${endDate})`
    } else if (startDate) {
      return `${name} (${startDate})`
    } else {
      return name
    }
  }
}

/**
 * 予約情報をFirestore用に変換
 */
export function convertReservationForFirestore(reservation: ReservationInfo): any {
  const now = new Date()
  
  return {
    ...reservation,
    created_at: reservation.created_at || now,
    updated_at: now
  }
}

/**
 * Firestoreから取得した予約情報をクライアント用に変換
 */
export function convertReservationFromFirestore(data: any): ReservationInfo {
  return {
    ...data,
    // FirestoreのTimestampをDateに変換
    start_date: data.start_date?.toDate?.() || data.start_date,
    end_date: data.end_date?.toDate?.() || data.end_date,
    departure_at: data.departure_at?.toDate?.() || data.departure_at,
    arrival_at: data.arrival_at?.toDate?.() || data.arrival_at,
    created_at: data.created_at?.toDate?.() || data.created_at,
    updated_at: data.updated_at?.toDate?.() || data.updated_at
  }
}
