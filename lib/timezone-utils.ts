// タイムゾーン関連のユーティリティ関数

import type { TimezoneInfo, TimezoneFailureLog, TimezoneMappingUpdate, PlaceData } from './types'
import logger from './logger'

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

// ローカルストレージキー
const TIMEZONE_FAILURE_LOGS_KEY = 'timezone_failure_logs'
const BATCH_SIZE = 50 // バッチ処理の閾値

// 失敗ログをローカルストレージに保存
const saveFailureLog = (log: Omit<TimezoneFailureLog, 'id'>): void => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') return
  
  try {
    const existingLogs = getFailureLogs()
    const newLog: TimezoneFailureLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    existingLogs.push(newLog)
    localStorage.setItem(TIMEZONE_FAILURE_LOGS_KEY, JSON.stringify(existingLogs))
    
    // バッチサイズに達したら通知
    if (existingLogs.length >= BATCH_SIZE) {
      logger.warn(`Timezone failure logs reached batch size (${BATCH_SIZE}). Consider processing.`)
    }
  } catch (error) {
    logger.error('Failed to save timezone failure log:', error)
  }
}

// 失敗ログを取得
const getFailureLogs = (): TimezoneFailureLog[] => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') return []
  
  try {
    const logs = localStorage.getItem(TIMEZONE_FAILURE_LOGS_KEY)
    return logs ? JSON.parse(logs) : []
  } catch (error) {
    logger.error('Failed to get timezone failure logs:', error)
    return []
  }
}

// 失敗ログをクリア
const clearFailureLogs = (): void => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(TIMEZONE_FAILURE_LOGS_KEY)
  } catch (error) {
    logger.error('Failed to clear timezone failure logs:', error)
  }
}

export const timezoneUtils = {
  // 場所情報からタイムゾーンを推定（ログ機能付き）
  getTimezoneFromPlace: (placeData: PlaceData, userId?: string): string => {
    if (!placeData) return 'UTC'
    
    let detectedCity: string | undefined
    let detectedCountry: string | undefined
    let failureReason: TimezoneFailureLog['failure_reason'] | null = null
    
    // 1. 都市名から推定
    const cityName = placeData.name?.toLowerCase()
    if (cityName && CITY_TIMEZONE_MAP[cityName]) {
      return CITY_TIMEZONE_MAP[cityName]
    }
    detectedCity = cityName
    
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
    detectedCountry = countryCode
    
    // 4. 推定失敗 - ログに記録
    if (!detectedCity && !detectedCountry) {
      failureReason = 'address_parse_failed'
    } else if (!detectedCity) {
      failureReason = 'city_not_found'
    } else {
      failureReason = 'country_not_found'
    }
    
    // 失敗ログを保存
    saveFailureLog({
      place_data: placeData,
      failure_reason: failureReason,
      detected_city: detectedCity,
      detected_country: detectedCountry,
      formatted_address: address,
      created_at: new Date(),
      user_id: userId,
      status: 'pending'
    })
    
    // デフォルトはUTC
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
      logger.error('Error converting time to UTC:', error)
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
      logger.error('Error converting UTC to local time:', error)
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
      logger.error('Error getting timezone offset:', error)
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
      logger.warn('Failed to get browser timezone:', error)
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
  },

  // 失敗ログ管理
  getFailureLogs,
  clearFailureLogs,
  
  // バッチ分析とマッピング更新
  analyzeFailureLogs: (): TimezoneMappingUpdate[] => {
    const logs = getFailureLogs()
    const cityCounts: Record<string, number> = {}
    const countryCounts: Record<string, number> = {}
    
    // 都市名と国コードの出現頻度を集計
    logs.forEach(log => {
      if (log.detected_city) {
        cityCounts[log.detected_city] = (cityCounts[log.detected_city] || 0) + 1
      }
      if (log.detected_country) {
        countryCounts[log.detected_country] = (countryCounts[log.detected_country] || 0) + 1
      }
    })
    
    const updates: TimezoneMappingUpdate[] = []
    
    // 高頻度の都市名を抽出（3回以上出現）
    Object.entries(cityCounts)
      .filter(([_, count]) => count >= 3)
      .forEach(([city, count]) => {
        // 国コードからタイムゾーンを推定
        const countryLogs = logs.filter(log => log.detected_city === city)
        const countryCode = countryLogs[0]?.detected_country
        
        if (countryCode && COUNTRY_TIMEZONE_MAP[countryCode]) {
          updates.push({
            city_name: city,
            timezone: COUNTRY_TIMEZONE_MAP[countryCode][0],
            confidence: count >= 10 ? 'high' : count >= 5 ? 'medium' : 'low',
            source: 'batch_analysis',
            created_at: new Date()
          })
        }
      })
    
    return updates
  },
  
  // マッピングを動的に更新
  updateCityTimezoneMapping: (updates: TimezoneMappingUpdate[]): void => {
    updates.forEach(update => {
      if (update.confidence === 'high' || update.confidence === 'medium') {
        // 高信頼度または中信頼度の場合のみ更新
        CITY_TIMEZONE_MAP[update.city_name.toLowerCase()] = update.timezone
        logger.debug(`Updated timezone mapping: ${update.city_name} -> ${update.timezone}`)
      }
    })
  },
  
  // 処理済みログをマーク
  markLogsAsProcessed: (logIds: string[]): void => {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') return
    
    const logs = getFailureLogs()
    const updatedLogs = logs.map(log => 
      logIds.includes(log.id) 
        ? { ...log, status: 'processed' as const }
        : log
    )
    
    try {
      localStorage.setItem(TIMEZONE_FAILURE_LOGS_KEY, JSON.stringify(updatedLogs))
    } catch (error) {
      logger.error('Failed to update log status:', error)
    }
  },
  
  // バッチ処理の実行
  processBatchUpdate: (): { updates: TimezoneMappingUpdate[], processedCount: number } => {
    const logs = getFailureLogs()
    const pendingLogs = logs.filter(log => log.status === 'pending')
    
    if (pendingLogs.length < BATCH_SIZE) {
      return { updates: [], processedCount: 0 }
    }
    
    const updates = timezoneUtils.analyzeFailureLogs()
    timezoneUtils.updateCityTimezoneMapping(updates)
    
    const processedIds = pendingLogs.map(log => log.id)
    timezoneUtils.markLogsAsProcessed(processedIds)
    
    return { updates, processedCount: processedIds.length }
  }
}
