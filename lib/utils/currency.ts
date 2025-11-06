// 通貨自動検出ユーティリティ

import type { CurrencyFailureLog, CurrencyMappingUpdate, PlaceData, Trip, User } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { getCurrencyByCountryCode, getCurrencyByCityName } from '@/lib/core/locations'
import { FailureLogger } from '@/lib/core/failure-logger'
import { extractCountryFromAddressComponents } from '@/lib/travel/country/utils'

// 通貨失敗ログ管理
const currencyFailureLogger = new FailureLogger<CurrencyFailureLog>('currency_failure_logs', 50)

// 通貨の詳細情報
import type { CurrencyInfo } from '@/lib/core/types'
import { t } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

// 通貨の基本情報（シンボルのみ保持、nameとcountryはi18n化）
const CURRENCY_BASE_INFO: Record<string, { code: string; symbol: string }> = {
  'JPY': { code: 'JPY', symbol: '¥' },
  'USD': { code: 'USD', symbol: '$' },
  'EUR': { code: 'EUR', symbol: '€' },
  'GBP': { code: 'GBP', symbol: '£' },
  'KRW': { code: 'KRW', symbol: '₩' },
  'CNY': { code: 'CNY', symbol: '¥' },
  'HKD': { code: 'HKD', symbol: 'HK$' },
  'SGD': { code: 'SGD', symbol: 'S$' },
  'THB': { code: 'THB', symbol: '฿' },
  'TWD': { code: 'TWD', symbol: 'NT$' },
  'AUD': { code: 'AUD', symbol: 'A$' },
  'CAD': { code: 'CAD', symbol: 'C$' },
  'CHF': { code: 'CHF', symbol: 'CHF' },
  'INR': { code: 'INR', symbol: '₹' },
  'MYR': { code: 'MYR', symbol: 'RM' },
  'IDR': { code: 'IDR', symbol: 'Rp' },
  'PHP': { code: 'PHP', symbol: '₱' },
  'VND': { code: 'VND', symbol: '₫' },
  'MXN': { code: 'MXN', symbol: 'MX$' },
  'SEK': { code: 'SEK', symbol: 'kr' },
  'NOK': { code: 'NOK', symbol: 'kr' },
  'DKK': { code: 'DKK', symbol: 'kr' },
  'PLN': { code: 'PLN', symbol: 'zł' },
  'CZK': { code: 'CZK', symbol: 'Kč' },
  'HUF': { code: 'HUF', symbol: 'Ft' },
  'RUB': { code: 'RUB', symbol: '₽' },
  'AED': { code: 'AED', symbol: 'د.إ' },
  'SAR': { code: 'SAR', symbol: '﷼' },
  'ILS': { code: 'ILS', symbol: '₪' },
  'TRY': { code: 'TRY', symbol: '₺' },
  'ZAR': { code: 'ZAR', symbol: 'R' },
  'BRL': { code: 'BRL', symbol: 'R$' },
  'ARS': { code: 'ARS', symbol: '$' },
  'CLP': { code: 'CLP', symbol: '$' },
  'COP': { code: 'COP', symbol: '$' },
  'PEN': { code: 'PEN', symbol: 'S/' },
  'NZD': { code: 'NZD', symbol: 'NZ$' },
  // 追加通貨（70+対応）
  'BDT': { code: 'BDT', symbol: '৳' },
  'BTN': { code: 'BTN', symbol: 'Nu.' },
  'BND': { code: 'BND', symbol: 'B$' },
  'KHR': { code: 'KHR', symbol: '៛' },
  'LKR': { code: 'LKR', symbol: 'Rs' },
  'MMK': { code: 'MMK', symbol: 'K' },
  'NPR': { code: 'NPR', symbol: 'Rs' },
  'PKR': { code: 'PKR', symbol: '₨' },
  'AFN': { code: 'AFN', symbol: '؋' },
  'IRR': { code: 'IRR', symbol: '﷼' },
  'IQD': { code: 'IQD', symbol: 'ع.د' },
  'JOD': { code: 'JOD', symbol: 'د.ا' },
  'KWD': { code: 'KWD', symbol: 'د.ك' },
  'LBP': { code: 'LBP', symbol: 'ل.ل' },
  'OMR': { code: 'OMR', symbol: '﷼' },
  'QAR': { code: 'QAR', symbol: '﷼' },
  'YER': { code: 'YER', symbol: '﷼' },
  'KZT': { code: 'KZT', symbol: '₸' },
  'UZS': { code: 'UZS', symbol: 'so\'m' },
  'GEL': { code: 'GEL', symbol: '₾' },
  'AMD': { code: 'AMD', symbol: '֏' },
  'AZN': { code: 'AZN', symbol: '₼' },
  'MNT': { code: 'MNT', symbol: '₮' },
  'ISK': { code: 'ISK', symbol: 'kr' },
  'RON': { code: 'RON', symbol: 'lei' },
  'BGN': { code: 'BGN', symbol: 'лв' },
  'RSD': { code: 'RSD', symbol: 'дин' },
  'BAM': { code: 'BAM', symbol: 'КМ' },
  'MKD': { code: 'MKD', symbol: 'ден' },
  'ALL': { code: 'ALL', symbol: 'L' },
  'UAH': { code: 'UAH', symbol: '₴' },
  'BYN': { code: 'BYN', symbol: 'Br' },
  'MDL': { code: 'MDL', symbol: 'L' },
  'EGP': { code: 'EGP', symbol: 'ج.م' },
  'MAD': { code: 'MAD', symbol: 'د.م.' },
  'TND': { code: 'TND', symbol: 'د.ت' },
  'DZD': { code: 'DZD', symbol: 'د.ج' },
  'KES': { code: 'KES', symbol: 'KSh' },
  'TZS': { code: 'TZS', symbol: 'TSh' },
  'UGX': { code: 'UGX', symbol: 'USh' },
  'ETB': { code: 'ETB', symbol: 'Br' },
  'GHS': { code: 'GHS', symbol: '₵' },
  'NGN': { code: 'NGN', symbol: '₦' },
  'CRC': { code: 'CRC', symbol: '₡' },
  'PAB': { code: 'PAB', symbol: 'B/.' },
  'GTQ': { code: 'GTQ', symbol: 'Q' },
  'HNL': { code: 'HNL', symbol: 'L' },
  'NIO': { code: 'NIO', symbol: 'C$' },
  'CUP': { code: 'CUP', symbol: '₱' },
  'DOP': { code: 'DOP', symbol: 'RD$' },
  'JMD': { code: 'JMD', symbol: 'J$' },
  'TTD': { code: 'TTD', symbol: 'TT$' },
  'UYU': { code: 'UYU', symbol: '$U' },
  'PYG': { code: 'PYG', symbol: 'Gs' },
  'BOB': { code: 'BOB', symbol: 'Bs.' },
  'VES': { code: 'VES', symbol: 'Bs.S' },
  'GYD': { code: 'GYD', symbol: '$' },
  'SRD': { code: 'SRD', symbol: '$' },
  'FJD': { code: 'FJD', symbol: 'FJ$' },
  'PGK': { code: 'PGK', symbol: 'K' },
  'XPF': { code: 'XPF', symbol: '₣' },
  'KYD': { code: 'KYD', symbol: '$' },
  'BMD': { code: 'BMD', symbol: '$' },
  'AWG': { code: 'AWG', symbol: 'ƒ' },
  'ANG': { code: 'ANG', symbol: 'ƒ' },
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

  /**
   * 階層的なフォールバック戦略で通貨を推測（CodeRabbit提案）
   * Venue → City → Trip → User → Default の順で推測
   * 
   * @param placeData - VenueのPlaceData
   * @param trip - Tripオブジェクト（オプション、destination_place/destination用）
   * @param user - Userオブジェクト（オプション、home_country_code用）
   * @param userId - ユーザーID（ログ用、オプション）
   * @returns 推測結果とその由来情報
   */
  getCurrencyFromPlaceEnhanced: (
    placeData?: PlaceData | null,
    trip?: Trip | null,
    user?: User | null,
    userId?: string
  ): { currency: string; source: 'venue' | 'city' | 'trip_place' | 'trip_destination' | 'user' | 'default'; confidence: 'high' | 'medium' | 'low' } => {
    logger.debug('🔍 getCurrencyFromPlaceEnhanced called', {
      hasPlaceData: !!placeData,
      hasAddressComponents: !!placeData?.address_components,
      hasTrip: !!trip,
      hasUser: !!user,
      placeName: placeData?.name,
      formattedAddress: placeData?.formatted_address
    })

    // 1. Venueのplace_dataから国コードを取得
    if (placeData?.address_components) {
      const countryCode = placeData.address_components.find(
        (component) => component.types.includes('country')
      )?.short_name

      logger.debug('📍 Step 1: Checking venue address_components', {
        hasAddressComponents: true,
        countryCode: countryCode || 'not found',
        allComponents: placeData.address_components.map(c => ({ types: c.types, short_name: c.short_name }))
      })

      if (countryCode) {
        const currency = getCurrencyByCountryCode(countryCode)
        logger.debug('💰 Step 1: getCurrencyByCountryCode result', {
          countryCode,
          currency: currency || 'null (not found in COUNTRIES map)'
        })
        if (currency) {
          logger.debug(`✅ Currency inferred from venue country: ${countryCode} -> ${currency}`)
          return { currency, source: 'venue', confidence: 'high' }
        } else {
          logger.debug(`⚠️ Country code ${countryCode} found but no currency mapping exists`)
        }
      } else {
        logger.debug('⚠️ Step 1: No country component found in address_components')
      }
    } else {
      logger.debug('⚠️ Step 1: No address_components available')
    }

    // 2. City名から推測
    if (placeData) {
      const address = placeData.formatted_address || ''
      const addressLower = address.toLowerCase()
      const cityCurrency = getCurrencyByCityName(addressLower)
      if (cityCurrency) {
        logger.debug(`Currency inferred from city name: ${addressLower} -> ${cityCurrency}`)
        return { currency: cityCurrency, source: 'city', confidence: 'high' }
      }

      // place_data.nameからも試す
      const placeName = placeData.name?.toLowerCase()
      if (placeName) {
        const nameCurrency = getCurrencyByCityName(placeName)
        if (nameCurrency) {
          logger.debug(`Currency inferred from place name: ${placeName} -> ${nameCurrency}`)
          return { currency: nameCurrency, source: 'city', confidence: 'medium' }
        }
      }
    }

    // 3. Tripのdestination_placeから国コードを取得
    if (trip?.destination_place?.address_components) {
      const countryInfo = extractCountryFromAddressComponents(trip.destination_place.address_components)
      if (countryInfo.countryCode && countryInfo.countryCode !== 'unknown') {
        const currency = getCurrencyByCountryCode(countryInfo.countryCode.toUpperCase())
        if (currency) {
          logger.debug(`Currency inferred from trip destination_place: ${countryInfo.countryCode} -> ${currency}`)
          return { currency, source: 'trip_place', confidence: 'medium' }
        }
      }
    }

    // 4. Tripのdestination文字列から推測（簡易版：主要都市名のマッチング）
    if (trip?.destination) {
      const destinationLower = trip.destination.toLowerCase()
      const destinationCurrency = getCurrencyByCityName(destinationLower)
      if (destinationCurrency) {
        logger.debug(`Currency inferred from trip destination string: ${destinationLower} -> ${destinationCurrency}`)
        return { currency: destinationCurrency, source: 'trip_destination', confidence: 'low' }
      }
    }

    // 5. ユーザーのhome_country_code
    if (user?.preferences?.home_country_code) {
      const currency = getCurrencyByCountryCode(user.preferences.home_country_code)
      if (currency) {
        logger.debug(`Currency inferred from user home_country_code: ${user.preferences.home_country_code} -> ${currency}`)
        return { currency, source: 'user', confidence: 'low' }
      }
    }

    // 6. デフォルト（JPY）
    logger.debug('❌ Currency inference failed at all steps, using default: JPY', {
      triedVenue: !!placeData?.address_components,
      triedCity: !!placeData,
      triedTripPlace: !!trip?.destination_place?.address_components,
      triedTripDestination: !!trip?.destination,
      triedUser: !!user?.preferences?.home_country_code
    })
    return { currency: 'JPY', source: 'default', confidence: 'low' }
  },

  // 通貨コードから詳細情報を取得（i18n対応）
  getCurrencyInfo: (currencyCode: string): CurrencyInfo => {
    const baseInfo = CURRENCY_BASE_INFO[currencyCode]
    if (!baseInfo) {
      // フォールバック: 未定義の通貨コード
      return {
        code: currencyCode,
        name: currencyCode,
        symbol: currencyCode,
        country: 'Unknown'
      }
    }
    
    // i18nキーから通貨名・国名を取得
    const nameKey = `currency.${currencyCode}.name` as TranslationKey
    const countryKey = `currency.${currencyCode}.country` as TranslationKey
    
    return {
      code: baseInfo.code,
      name: t(nameKey) || currencyCode, // フォールバック: キーが存在しない場合は通貨コード
      symbol: baseInfo.symbol,
      country: t(countryKey) || 'Unknown' // フォールバック: キーが存在しない場合は'Unknown'
    }
  },

  // 利用可能な通貨リストを取得（i18n対応）
  getAvailableCurrencies: (): CurrencyInfo[] => {
    return Object.keys(CURRENCY_BASE_INFO).map(code => 
      currencyUtils.getCurrencyInfo(code)
    )
  },

  // 通貨コードが有効かチェック
  isValidCurrency: (currencyCode: string): boolean => {
    return currencyCode in CURRENCY_BASE_INFO
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
