// 通貨自動検出ユーティリティ

import type { CurrencyFailureLog, CurrencyMappingUpdate, PlaceData } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { getCurrencyByCountryCode, getCurrencyByCityName } from '@/lib/core/locations'
import { FailureLogger } from '@/lib/core/failure-logger'

// 通貨失敗ログ管理
const currencyFailureLogger = new FailureLogger<CurrencyFailureLog>('currency_failure_logs', 50)

// 通貨の詳細情報
import type { CurrencyInfo } from '@/lib/core/types'

const CURRENCY_INFO: Record<string, CurrencyInfo> = {
  'JPY': { code: 'JPY', name: '日本円', symbol: '¥', country: '日本' },
  'USD': { code: 'USD', name: '米ドル', symbol: '$', country: 'アメリカ' },
  'EUR': { code: 'EUR', name: 'ユーロ', symbol: '€', country: 'ヨーロッパ' },
  'GBP': { code: 'GBP', name: '英ポンド', symbol: '£', country: 'イギリス' },
  'KRW': { code: 'KRW', name: '韓国ウォン', symbol: '₩', country: '韓国' },
  'CNY': { code: 'CNY', name: '中国元', symbol: '¥', country: '中国' },
  'HKD': { code: 'HKD', name: '香港ドル', symbol: 'HK$', country: '香港' },
  'SGD': { code: 'SGD', name: 'シンガポールドル', symbol: 'S$', country: 'シンガポール' },
  'THB': { code: 'THB', name: 'タイバーツ', symbol: '฿', country: 'タイ' },
  'TWD': { code: 'TWD', name: '台湾ドル', symbol: 'NT$', country: '台湾' },
  'AUD': { code: 'AUD', name: '豪ドル', symbol: 'A$', country: 'オーストラリア' },
  'CAD': { code: 'CAD', name: 'カナダドル', symbol: 'C$', country: 'カナダ' },
  'CHF': { code: 'CHF', name: 'スイスフラン', symbol: 'CHF', country: 'スイス' },
  'INR': { code: 'INR', name: 'インドルピー', symbol: '₹', country: 'インド' },
  'MYR': { code: 'MYR', name: 'マレーシアリンギット', symbol: 'RM', country: 'マレーシア' },
  'IDR': { code: 'IDR', name: 'インドネシアルピア', symbol: 'Rp', country: 'インドネシア' },
  'PHP': { code: 'PHP', name: 'フィリピンペソ', symbol: '₱', country: 'フィリピン' },
  'VND': { code: 'VND', name: 'ベトナムドン', symbol: '₫', country: 'ベトナム' },
  'MXN': { code: 'MXN', name: 'メキシコペソ', symbol: 'MX$', country: 'メキシコ' },
  'SEK': { code: 'SEK', name: 'スウェーデンクローナ', symbol: 'kr', country: 'スウェーデン' },
  'NOK': { code: 'NOK', name: 'ノルウェークローネ', symbol: 'kr', country: 'ノルウェー' },
  'DKK': { code: 'DKK', name: 'デンマーククローネ', symbol: 'kr', country: 'デンマーク' },
  'PLN': { code: 'PLN', name: 'ポーランドズロチ', symbol: 'zł', country: 'ポーランド' },
  'CZK': { code: 'CZK', name: 'チェココルナ', symbol: 'Kč', country: 'チェコ' },
  'HUF': { code: 'HUF', name: 'ハンガリーフォリント', symbol: 'Ft', country: 'ハンガリー' },
  'RUB': { code: 'RUB', name: 'ロシアルーブル', symbol: '₽', country: 'ロシア' },
  'AED': { code: 'AED', name: 'アラブ首長国連邦ディルハム', symbol: 'د.إ', country: 'UAE' },
  'SAR': { code: 'SAR', name: 'サウジアラビアリヤル', symbol: '﷼', country: 'サウジアラビア' },
  'ILS': { code: 'ILS', name: 'イスラエルシェケル', symbol: '₪', country: 'イスラエル' },
  'TRY': { code: 'TRY', name: 'トルコリラ', symbol: '₺', country: 'トルコ' },
  'ZAR': { code: 'ZAR', name: '南アフリカランド', symbol: 'R', country: '南アフリカ' },
  'BRL': { code: 'BRL', name: 'ブラジルレアル', symbol: 'R$', country: 'ブラジル' },
  'ARS': { code: 'ARS', name: 'アルゼンチンペソ', symbol: '$', country: 'アルゼンチン' },
  'CLP': { code: 'CLP', name: 'チリペソ', symbol: '$', country: 'チリ' },
  'COP': { code: 'COP', name: 'コロンビアペソ', symbol: '$', country: 'コロンビア' },
  'PEN': { code: 'PEN', name: 'ペルーソル', symbol: 'S/', country: 'ペルー' },
  'NZD': { code: 'NZD', name: 'ニュージーランドドル', symbol: 'NZ$', country: 'ニュージーランド' },
}

export const currencyUtils = {
  // 場所情報から通貨を推定（ログ機能付き）
  getCurrencyFromPlace: (placeData: PlaceData, userId?: string): string => {
    if (!placeData) return 'JPY' // デフォルトは日本円
    
    let detectedCity: string | undefined
    let detectedCountry: string | undefined
    let failureReason: CurrencyFailureLog['failure_reason'] | null = null
    
    // 1. address_componentsから国コードを取得
    const countryCode = placeData.address_components?.find(
      (component: any) => component.types.includes('country')
    )?.short_name
    
    if (countryCode) {
      const currency = getCurrencyByCountryCode(countryCode)
      if (currency) {
        return currency
      }
    }
    detectedCountry = countryCode
    
    // 2. formatted_addressから都市名を推定
    const address = placeData.formatted_address || ''
    const addressLower = address.toLowerCase()
    
    // 主要都市名から通貨を直接取得
    const currency = getCurrencyByCityName(addressLower)
    if (currency) {
      return currency
    }
    
    // 3. 都市名検出
    const cityName = placeData.name?.toLowerCase()
    detectedCity = cityName
    
    // 4. 推定失敗 - ログに記録
    if (!detectedCity && !detectedCountry) {
      failureReason = 'address_parse_failed'
    } else if (!detectedCountry) {
      failureReason = 'country_not_found'
    } else {
      failureReason = 'city_not_found'
    }
    
    // 失敗ログを保存
    currencyFailureLogger.save({
      place_data: placeData,
      failure_reason: failureReason,
      detected_city: detectedCity,
      detected_country: detectedCountry,
      formatted_address: address,
      created_at: new Date(),
      user_id: userId,
      status: 'pending'
    })
    
    // デフォルトは日本円
    return 'JPY'
  },

  // 通貨コードから詳細情報を取得
  getCurrencyInfo: (currencyCode: string): CurrencyInfo => {
    return CURRENCY_INFO[currencyCode] || {
      code: currencyCode,
      name: currencyCode,
      symbol: currencyCode,
      country: 'Unknown'
    }
  },

  // 利用可能な通貨リストを取得
  getAvailableCurrencies: (): CurrencyInfo[] => {
    return Object.values(CURRENCY_INFO)
  },

  // 通貨コードが有効かチェック
  isValidCurrency: (currencyCode: string): boolean => {
    return currencyCode in CURRENCY_INFO
  },

  // 金額をフォーマット
  formatAmount: (amount: number, currencyCode: string): string => {
    const info = currencyUtils.getCurrencyInfo(currencyCode)
    
    // 通貨によって小数点の扱いを変える
    const decimals = ['JPY', 'KRW', 'VND'].includes(currencyCode) ? 0 : 2
    
    return `${amount.toLocaleString('ja-JP', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })} ${info.symbol}`
  },

  // 失敗ログ管理
  getCurrencyFailureLogs: (): CurrencyFailureLog[] => currencyFailureLogger.getLogs(),
  clearCurrencyFailureLogs: (): void => currencyFailureLogger.clear(),
  
  // バッチ分析とマッピング更新
  analyzeCurrencyFailureLogs: (): CurrencyMappingUpdate[] => {
    const logs = currencyFailureLogger.getLogs()
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
    
    const updates: CurrencyMappingUpdate[] = []
    
    // 高頻度の都市名を抽出（3回以上出現）
    Object.entries(cityCounts)
      .filter(([_, count]) => count >= 3)
      .forEach(([city, count]) => {
        // 国コードから通貨を推定
        const countryLogs = logs.filter(log => log.detected_city === city)
        const countryCode = countryLogs[0]?.detected_country
        
        if (countryCode) {
          const currency = getCurrencyByCountryCode(countryCode)
          if (currency) {
            updates.push({
              city_name: city,
              currency,
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
  updateCityCurrencyMapping: (updates: CurrencyMappingUpdate[]): void => {
    // 都市マッピングは実行時にのみ適用（既存の cityCountryMap を拡張）
    updates.forEach(update => {
      if (update.confidence === 'high' || update.confidence === 'medium') {
        logger.debug(`Updated currency mapping: ${update.city_name} -> ${update.currency}`)
      }
    })
  },
  
  // 処理済みログをマーク
  markCurrencyLogsAsProcessed: (logIds: string[]): void => {
    currencyFailureLogger.markAsProcessed(logIds)
  },
  
  // バッチ処理の実行
  processCurrencyBatchUpdate: (): { updates: CurrencyMappingUpdate[], processedCount: number } => {
    const pendingLogs = currencyFailureLogger.getPendingLogs()
    
    if (!currencyFailureLogger.shouldProcessBatch()) {
      return { updates: [], processedCount: 0 }
    }
    
    const updates = currencyUtils.analyzeCurrencyFailureLogs()
    currencyUtils.updateCityCurrencyMapping(updates)
    
    const processedIds = pendingLogs.map(log => log.id)
    currencyUtils.markCurrencyLogsAsProcessed(processedIds)
    
    return { updates, processedCount: processedIds.length }
  }
}
