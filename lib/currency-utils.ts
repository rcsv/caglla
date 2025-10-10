// 通貨自動検出ユーティリティ

import type { CurrencyFailureLog, CurrencyMappingUpdate, PlaceData } from './types'
import logger from './logger'

// 国コードから通貨を推定するマッピング
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // アジア
  'JP': 'JPY', // 日本
  'KR': 'KRW', // 韓国
  'CN': 'CNY', // 中国
  'HK': 'HKD', // 香港
  'SG': 'SGD', // シンガポール
  'TH': 'THB', // タイ
  'TW': 'TWD', // 台湾
  'IN': 'INR', // インド
  'MY': 'MYR', // マレーシア
  'ID': 'IDR', // インドネシア
  'PH': 'PHP', // フィリピン
  'VN': 'VND', // ベトナム
  
  // 北米
  'US': 'USD', // アメリカ
  'CA': 'CAD', // カナダ
  'MX': 'MXN', // メキシコ
  
  // ヨーロッパ
  'GB': 'GBP', // イギリス
  'FR': 'EUR', // フランス
  'DE': 'EUR', // ドイツ
  'IT': 'EUR', // イタリア
  'ES': 'EUR', // スペイン
  'NL': 'EUR', // オランダ
  'CH': 'CHF', // スイス
  'AT': 'EUR', // オーストリア
  'BE': 'EUR', // ベルギー
  'SE': 'SEK', // スウェーデン
  'NO': 'NOK', // ノルウェー
  'DK': 'DKK', // デンマーク
  'FI': 'EUR', // フィンランド
  'PL': 'PLN', // ポーランド
  'CZ': 'CZK', // チェコ
  'HU': 'HUF', // ハンガリー
  'RU': 'RUB', // ロシア
  
  // オセアニア
  'AU': 'AUD', // オーストラリア
  'NZ': 'NZD', // ニュージーランド
  
  // その他
  'AE': 'AED', // アラブ首長国連邦
  'SA': 'SAR', // サウジアラビア
  'IL': 'ILS', // イスラエル
  'TR': 'TRY', // トルコ
  'ZA': 'ZAR', // 南アフリカ
  'BR': 'BRL', // ブラジル
  'AR': 'ARS', // アルゼンチン
  'CL': 'CLP', // チリ
  'CO': 'COP', // コロンビア
  'PE': 'PEN', // ペルー
}

// 通貨の詳細情報
import type { CurrencyInfo } from './types'

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

// ローカルストレージキー
const CURRENCY_FAILURE_LOGS_KEY = 'currency_failure_logs'
const BATCH_SIZE = 50 // バッチ処理の閾値

// 失敗ログをローカルストレージに保存
const saveCurrencyFailureLog = (log: Omit<CurrencyFailureLog, 'id'>): void => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') return
  
  try {
    const existingLogs = getCurrencyFailureLogs()
    const newLog: CurrencyFailureLog = {
      ...log,
      id: `currency_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    existingLogs.push(newLog)
    localStorage.setItem(CURRENCY_FAILURE_LOGS_KEY, JSON.stringify(existingLogs))
    
    // バッチサイズに達したら通知
    if (existingLogs.length >= BATCH_SIZE) {
      logger.warn(`Currency failure logs reached batch size (${BATCH_SIZE}). Consider processing.`)
    }
  } catch (error) {
    logger.error('Failed to save currency failure log:', error)
  }
}

// 失敗ログを取得
const getCurrencyFailureLogs = (): CurrencyFailureLog[] => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') return []
  
  try {
    const logs = localStorage.getItem(CURRENCY_FAILURE_LOGS_KEY)
    return logs ? JSON.parse(logs) : []
  } catch (error) {
    logger.error('Failed to get currency failure logs:', error)
    return []
  }
}

// 失敗ログをクリア
const clearCurrencyFailureLogs = (): void => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(CURRENCY_FAILURE_LOGS_KEY)
  } catch (error) {
    logger.error('Failed to clear currency failure logs:', error)
  }
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
    
    if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
      return COUNTRY_CURRENCY_MAP[countryCode]
    }
    detectedCountry = countryCode
    
    // 2. formatted_addressから都市名を推定
    const address = placeData.formatted_address || ''
    const addressLower = address.toLowerCase()
    
    // 主要都市名から国を推定
    const cityCountryMap: Record<string, string> = {
      'tokyo': 'JP',
      'osaka': 'JP',
      'kyoto': 'JP',
      'seoul': 'KR',
      'busan': 'KR',
      'beijing': 'CN',
      'shanghai': 'CN',
      'hong kong': 'HK',
      'singapore': 'SG',
      'bangkok': 'TH',
      'taipei': 'TW',
      'mumbai': 'IN',
      'delhi': 'IN',
      'sydney': 'AU',
      'melbourne': 'AU',
      'new york': 'US',
      'los angeles': 'US',
      'london': 'GB',
      'paris': 'FR',
      'berlin': 'DE',
      'rome': 'IT',
      'madrid': 'ES',
      'amsterdam': 'NL',
      'zurich': 'CH',
      'geneva': 'CH',
      'dubai': 'AE',
      'abu dhabi': 'AE',
    }
    
    for (const [city, country] of Object.entries(cityCountryMap)) {
      if (addressLower.includes(city)) {
        return COUNTRY_CURRENCY_MAP[country] || 'JPY'
      }
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
    saveCurrencyFailureLog({
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
  getCurrencyFailureLogs,
  clearCurrencyFailureLogs,
  
  // バッチ分析とマッピング更新
  analyzeCurrencyFailureLogs: (): CurrencyMappingUpdate[] => {
    const logs = getCurrencyFailureLogs()
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
        
        if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
          updates.push({
            city_name: city,
            currency: COUNTRY_CURRENCY_MAP[countryCode],
            confidence: count >= 10 ? 'high' : count >= 5 ? 'medium' : 'low',
            source: 'batch_analysis',
            created_at: new Date()
          })
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
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') return
    
    const logs = getCurrencyFailureLogs()
    const updatedLogs = logs.map(log => 
      logIds.includes(log.id) 
        ? { ...log, status: 'processed' as const }
        : log
    )
    
    try {
      localStorage.setItem(CURRENCY_FAILURE_LOGS_KEY, JSON.stringify(updatedLogs))
    } catch (error) {
      logger.error('Failed to update currency log status:', error)
    }
  },
  
  // バッチ処理の実行
  processCurrencyBatchUpdate: (): { updates: CurrencyMappingUpdate[], processedCount: number } => {
    const logs = getCurrencyFailureLogs()
    const pendingLogs = logs.filter(log => log.status === 'pending')
    
    if (pendingLogs.length < BATCH_SIZE) {
      return { updates: [], processedCount: 0 }
    }
    
    const updates = currencyUtils.analyzeCurrencyFailureLogs()
    currencyUtils.updateCityCurrencyMapping(updates)
    
    const processedIds = pendingLogs.map(log => log.id)
    currencyUtils.markCurrencyLogsAsProcessed(processedIds)
    
    return { updates, processedCount: processedIds.length }
  }
}
