// ブラウザ情報を取得するユーティリティ関数

import type { BrowserInfo } from '@/lib/core/types'
import logger from '@/lib/core/logger'

// 通貨コードを取得（Intl.NumberFormatを使用）
export function getCurrencyFromLocale(): string {
  try {
    // デフォルトのロケールから通貨を推測
    const locale = navigator.language || 'en-US'
    const currency = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD' // デフォルト値
    }).resolvedOptions().currency
    
    // より正確な通貨を取得するため、ロケールベースでマッピング
    const currencyMap: { [key: string]: string } = {
      'ja-JP': 'JPY',
      'en-US': 'USD',
      'en-GB': 'GBP',
      'de-DE': 'EUR',
      'fr-FR': 'EUR',
      'es-ES': 'EUR',
      'it-IT': 'EUR',
      'pt-BR': 'BRL',
      'ko-KR': 'KRW',
      'zh-CN': 'CNY',
      'zh-TW': 'TWD',
      'th-TH': 'THB',
      'vi-VN': 'VND',
      'id-ID': 'IDR',
      'ms-MY': 'MYR',
      'hi-IN': 'INR',
      'ar-SA': 'SAR',
      'ru-RU': 'RUB',
      'tr-TR': 'TRY',
      'pl-PL': 'PLN',
      'cs-CZ': 'CZK',
      'hu-HU': 'HUF',
      'ro-RO': 'RON',
      'bg-BG': 'BGN',
      'hr-HR': 'HRK',
      'sk-SK': 'EUR',
      'sl-SI': 'EUR',
      'et-EE': 'EUR',
      'lv-LV': 'EUR',
      'lt-LT': 'EUR',
      'uk-UA': 'UAH',
      'be-BY': 'BYN',
      'ka-GE': 'GEL',
      'hy-AM': 'AMD',
      'az-AZ': 'AZN',
      'kk-KZ': 'KZT',
      'ky-KG': 'KGS',
      'uz-UZ': 'UZS',
      'mn-MN': 'MNT',
      'ja': 'JPY',
      'en': 'USD',
      'de': 'EUR',
      'fr': 'EUR',
      'es': 'EUR',
      'it': 'EUR',
      'pt': 'BRL',
      'ko': 'KRW',
      'zh': 'CNY',
      'th': 'THB',
      'vi': 'VND',
      'id': 'IDR',
      'ms': 'MYR',
      'hi': 'INR',
      'ar': 'SAR',
      'ru': 'RUB',
      'tr': 'TRY',
      'pl': 'PLN',
      'cs': 'CZK',
      'hu': 'HUF',
      'ro': 'RON',
      'bg': 'BGN',
      'hr': 'HRK',
      'sk': 'EUR',
      'sl': 'EUR',
      'et': 'EUR',
      'lv': 'EUR',
      'lt': 'EUR',
      'uk': 'UAH',
      'be': 'BYN',
      'ka': 'GEL',
      'hy': 'AMD',
      'az': 'AZN',
      'kk': 'KZT',
      'ky': 'KGS',
      'uz': 'UZS',
      'mn': 'MNT'
    }
    
    // 完全なロケールから検索
    if (currencyMap[locale]) {
      return currencyMap[locale]
    }
    
    // 言語コードのみから検索
    const languageCode = locale.split('-')[0]
    if (currencyMap[languageCode]) {
      return currencyMap[languageCode]
    }
    
    return currency || 'USD'
  } catch (error) {
    logger.warn('Failed to get currency from locale:', error)
    return 'USD'
  }
}

// タイムゾーンを取得
export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    logger.warn('Failed to get timezone:', error)
    return 'UTC'
  }
}

// 言語を取得
export function getLanguage(): string {
  try {
    return navigator.language || 'en'
  } catch (error) {
    logger.warn('Failed to get language:', error)
    return 'en'
  }
}

// 位置情報から住所を取得（ユーザーの許可が必要）
export async function getHomeAddress(): Promise<string | undefined> {
  if (!navigator.geolocation) {
    logger.warn('Geolocation is not supported by this browser')
    return undefined
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分間キャッシュ
      })
    })

    const { latitude, longitude } = position.coords
    
    // 逆ジオコーディングで住所を取得
    const address = await reverseGeocode(latitude, longitude)
    return address
  } catch (error) {
    logger.warn('Failed to get location:', error)
    return undefined
  }
}

// 逆ジオコーディング（OpenStreetMap Nominatim APIを使用）
async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=${navigator.language}`
    )
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }
    
    const data = await response.json()
    
    if (data.address) {
      const { address } = data
      const parts = []
      
      // 住所の構成要素を組み合わせ
      if (address.house_number && address.road) {
        parts.push(`${address.house_number} ${address.road}`)
      } else if (address.road) {
        parts.push(address.road)
      }
      
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village)
      }
      
      if (address.state) {
        parts.push(address.state)
      }
      
      if (address.country) {
        parts.push(address.country)
      }
      
      return parts.join(', ')
    }
    
    return undefined
  } catch (error) {
    logger.warn('Reverse geocoding failed:', error)
    return undefined
  }
}

// ブラウザ情報をまとめて取得
export async function getBrowserInfo(): Promise<BrowserInfo> {
  const [homeAddress] = await Promise.all([
    getHomeAddress().catch(() => undefined)
  ])
  
  return {
    currency: getCurrencyFromLocale(),
    timezone: getTimezone(),
    language: getLanguage(),
    homeAddress
  }
}
