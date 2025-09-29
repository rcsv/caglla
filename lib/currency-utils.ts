// 通貨自動検出ユーティリティ

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

export const currencyUtils = {
  // 場所情報から通貨を推定
  getCurrencyFromPlace: (placeData: any): string => {
    if (!placeData) return 'JPY' // デフォルトは日本円
    
    // 1. address_componentsから国コードを取得
    const countryCode = placeData.address_components?.find(
      (component: any) => component.types.includes('country')
    )?.short_name
    
    if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
      return COUNTRY_CURRENCY_MAP[countryCode]
    }
    
    // 2. formatted_addressから国名を推定
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
    }
    
    for (const [city, country] of Object.entries(cityCountryMap)) {
      if (addressLower.includes(city)) {
        return COUNTRY_CURRENCY_MAP[country] || 'JPY'
      }
    }
    
    // 3. デフォルトは日本円
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
  }
}
