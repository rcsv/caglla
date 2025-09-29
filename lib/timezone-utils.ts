// タイムゾーン関連のユーティリティ関数

import type { TimezoneInfo } from './types'

// 主要都市のタイムゾーンマッピング
const CITY_TIMEZONE_MAP: Record<string, string> = {
  // 日本
  'tokyo': 'Asia/Tokyo',
  'osaka': 'Asia/Tokyo',
  'kyoto': 'Asia/Tokyo',
  'sapporo': 'Asia/Tokyo',
  
  // アメリカ
  'new york': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'san francisco': 'America/Los_Angeles',
  'las vegas': 'America/Los_Angeles',
  'miami': 'America/New_York',
  
  // ヨーロッパ
  'london': 'Europe/London',
  'paris': 'Europe/Paris',
  'rome': 'Europe/Rome',
  'berlin': 'Europe/Berlin',
  'madrid': 'Europe/Madrid',
  'amsterdam': 'Europe/Amsterdam',
  
  // アジア
  'seoul': 'Asia/Seoul',
  'beijing': 'Asia/Shanghai',
  'shanghai': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  'singapore': 'Asia/Singapore',
  'bangkok': 'Asia/Bangkok',
  'taipei': 'Asia/Taipei',
  
  // オセアニア
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'auckland': 'Pacific/Auckland',
  
  // 太平洋諸島
  'honolulu': 'Pacific/Honolulu',
  'guam': 'Pacific/Guam',
  'saipan': 'Pacific/Saipan',
  
  // インド・南アジア
  'mumbai': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  'bangalore': 'Asia/Kolkata',
  'chennai': 'Asia/Kolkata',
  'kolkata': 'Asia/Kolkata',
  
  // その他
  'dubai': 'Asia/Dubai',
  'moscow': 'Europe/Moscow',
  'istanbul': 'Europe/Istanbul',
}

// 国コードからタイムゾーンを推定
const COUNTRY_TIMEZONE_MAP: Record<string, string[]> = {
  'JP': ['Asia/Tokyo'],
  'US': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
  'GB': ['Europe/London'],
  'FR': ['Europe/Paris'],
  'DE': ['Europe/Berlin'],
  'IT': ['Europe/Rome'],
  'ES': ['Europe/Madrid'],
  'KR': ['Asia/Seoul'],
  'CN': ['Asia/Shanghai'],
  'HK': ['Asia/Hong_Kong'],
  'SG': ['Asia/Singapore'],
  'TH': ['Asia/Bangkok'],
  'TW': ['Asia/Taipei'],
  'AU': ['Australia/Sydney', 'Australia/Melbourne'],
  'NZ': ['Pacific/Auckland'],
  'GU': ['Pacific/Guam'],
  'MP': ['Pacific/Saipan'],
  'IN': ['Asia/Kolkata'],
  'AE': ['Asia/Dubai'],
  'RU': ['Europe/Moscow'],
  'TR': ['Europe/Istanbul'],
}

export const timezoneUtils = {
  // 場所情報からタイムゾーンを推定
  getTimezoneFromPlace: (placeData: any): string => {
    if (!placeData) return 'UTC'
    
    // 1. 都市名から推定
    const cityName = placeData.name?.toLowerCase()
    if (cityName && CITY_TIMEZONE_MAP[cityName]) {
      return CITY_TIMEZONE_MAP[cityName]
    }
    
    // 2. 住所から都市名を抽出して推定
    const address = placeData.formatted_address || ''
    const addressLower = address.toLowerCase()
    
    for (const [city, timezone] of Object.entries(CITY_TIMEZONE_MAP)) {
      if (addressLower.includes(city)) {
        return timezone
      }
    }
    
    // 3. 国コードから推定（最初のタイムゾーンを使用）
    const countryCode = placeData.address_components?.find(
      (component: any) => component.types.includes('country')
    )?.short_name
    
    if (countryCode && COUNTRY_TIMEZONE_MAP[countryCode]) {
      return COUNTRY_TIMEZONE_MAP[countryCode][0]
    }
    
    // 4. デフォルトはUTC
    return 'UTC'
  },

  // 時間をUTCに変換
  convertToUTC: (time: string, timezone: string): string => {
    if (!time || !timezone) return ''
    
    try {
      // 今日の日付で時間を作成
      const today = new Date()
      const [hours, minutes] = time.split(':').map(Number)
      
      // 指定されたタイムゾーンで日時を作成
      const localDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)
      
      // タイムゾーンを考慮してUTCに変換
      const utcDateTime = new Date(localDateTime.toLocaleString('en-US', { timeZone: timezone }))
      const utcOffset = localDateTime.getTime() - utcDateTime.getTime()
      
      return new Date(localDateTime.getTime() + utcOffset).toISOString()
    } catch (error) {
      console.error('Error converting time to UTC:', error)
      return ''
    }
  },

  // UTC時間を指定されたタイムゾーンに変換
  convertFromUTC: (utcTime: string, timezone: string): string => {
    if (!utcTime || !timezone) return ''
    
    try {
      const date = new Date(utcTime)
      const localTime = date.toLocaleTimeString('ja-JP', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
      
      return localTime
    } catch (error) {
      console.error('Error converting UTC to local time:', error)
      return ''
    }
  },

  // タイムゾーンのオフセットを取得（分単位）
  getTimezoneOffset: (timezone: string): number => {
    try {
      const now = new Date()
      const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
      const local = new Date(utc.toLocaleString('en-US', { timeZone: timezone }))
      
      return (local.getTime() - utc.getTime()) / 60000
    } catch (error) {
      console.error('Error getting timezone offset:', error)
      return 0
    }
  },

  // タイムゾーン情報を取得
  getTimezoneInfo: (timezone: string): TimezoneInfo => {
    const offset = timezoneUtils.getTimezoneOffset(timezone)
    
    return {
      timezone,
      offset,
      city: timezone.split('/')[1] || timezone,
      country: timezone.split('/')[0] || 'Unknown'
    }
  },

  // 現在のブラウザタイムゾーンを取得
  getBrowserTimezone: (): string => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (error) {
      console.warn('Failed to get browser timezone:', error)
      return 'UTC'
    }
  },

  // タイムゾーンが有効かチェック
  isValidTimezone: (timezone: string): boolean => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
      return true
    } catch (error) {
      return false
    }
  }
}
