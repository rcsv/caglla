// タイムゾーン関連のユーティリティ関数

import type { TimezoneInfo, TimezoneFailureLog, TimezoneMappingUpdate, PlaceData } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { getTimezoneByCountryCode, getTimezoneByCityName } from '@/lib/core/locations'
import { FailureLogger } from '@/lib/core/failure-logger'

// タイムゾーン失敗ログ管理
const timezoneFailureLogger = new FailureLogger<TimezoneFailureLog>('timezone_failure_logs', 50)

export const timezoneUtils = {
  // 場所情報からタイムゾーンを推定（ログ機能付き）
  getTimezoneFromPlace: (placeData: PlaceData, userId?: string): string => {
    if (!placeData) return 'UTC'
    
    let detectedCity: string | undefined
    let detectedCountry: string | undefined
    let failureReason: TimezoneFailureLog['failure_reason'] | null = null
    
    // 1. 国コードから推定（最も正確）
    const countryCode = placeData.address_components?.find(
      (component: any) => component.types.includes('country')
    )?.short_name
    
    if (countryCode) {
      const timezone = getTimezoneByCountryCode(countryCode)
      if (timezone && timezone !== 'UTC') {
        return timezone
      }
    }
    detectedCountry = countryCode
    
    // 2. 都市名から推定（完全一致）
    const cityName = placeData.name?.toLowerCase()
    if (cityName) {
      const timezone = getTimezoneByCityName(cityName)
      if (timezone) {
        return timezone
      }
    }
    detectedCity = cityName
    
    // 3. 都市名から推定（部分一致）- 新しい改善
    // "Los Angeles Airport" や "New York, NY" のような複合名に対応
    const placesToCheck = [
      placeData.name,
      placeData.formatted_address
    ].filter(Boolean).map(s => s!.toLowerCase())
    
    for (const text of placesToCheck) {
      // 主要都市名を部分一致で検索
      const cities = [
        'tokyo', 'osaka', 'kyoto', 'new york', 'los angeles', 'san francisco',
        'london', 'paris', 'rome', 'berlin', 'madrid', 'amsterdam',
        'seoul', 'beijing', 'shanghai', 'singapore', 'bangkok', 'hong kong',
        'sydney', 'melbourne', 'auckland', 'honolulu',
        'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata',
        'dubai', 'moscow', 'istanbul', 'chicago', 'las vegas', 'miami'
      ]
      
      for (const city of cities) {
        if (text.includes(city)) {
          const timezone = getTimezoneByCityName(city)
          if (timezone) {
            return timezone
          }
        }
      }
    }
    
    // 4. 推定失敗 - ログに記録
    if (!detectedCity && !detectedCountry) {
      failureReason = 'address_parse_failed'
    } else if (!detectedCity) {
      failureReason = 'city_not_found'
    } else {
      failureReason = 'country_not_found'
    }
    
    // 失敗ログを保存
    timezoneFailureLogger.save({
      place_data: placeData,
      failure_reason: failureReason,
      detected_city: detectedCity,
      detected_country: detectedCountry,
      formatted_address: placeData.formatted_address || '',
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
  getFailureLogs: (): TimezoneFailureLog[] => timezoneFailureLogger.getLogs(),
  clearFailureLogs: (): void => timezoneFailureLogger.clear(),
  
  // バッチ分析とマッピング更新
  analyzeFailureLogs: (): TimezoneMappingUpdate[] => {
    const logs = timezoneFailureLogger.getLogs()
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
        
        if (countryCode) {
          const timezone = getTimezoneByCountryCode(countryCode)
          if (timezone) {
            updates.push({
              city_name: city,
              timezone,
              confidence: count >= 10 ? 'high' : count >= 5 ? 'medium' : 'low',
              source: 'batch_analysis',
              created_at: new Date()
            })
          }
        }
      })
    
    return updates
  },
  
  // マッピングを動的に更新
  // NOTE: 新しいマッピングシステム (lib/data/locations.ts) は静的なので、
  // 動的更新は現在サポートされていません。将来的にデータベースベースのマッピングを実装する際に復活させる予定。
  updateCityTimezoneMapping: (updates: TimezoneMappingUpdate[]): void => {
    updates.forEach(update => {
      if (update.confidence === 'high' || update.confidence === 'medium') {
        logger.debug(`Timezone mapping suggestion: ${update.city_name} -> ${update.timezone}`)
        // TODO: データベースまたはFirestoreにマッピングを保存する実装を追加
      }
    })
  },
  
  // 処理済みログをマーク
  markLogsAsProcessed: (logIds: string[]): void => {
    timezoneFailureLogger.markAsProcessed(logIds)
  },
  
  // バッチ処理の実行
  processBatchUpdate: (): { updates: TimezoneMappingUpdate[], processedCount: number } => {
    const pendingLogs = timezoneFailureLogger.getPendingLogs()
    
    if (!timezoneFailureLogger.shouldProcessBatch()) {
      return { updates: [], processedCount: 0 }
    }
    
    const updates = timezoneUtils.analyzeFailureLogs()
    timezoneUtils.updateCityTimezoneMapping(updates)
    
    const processedIds = pendingLogs.map(log => log.id)
    timezoneUtils.markLogsAsProcessed(processedIds)
    
    return { updates, processedCount: processedIds.length }
  }
}
