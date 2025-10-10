/**
 * 国・都市の統合マッピングデータ
 * 国名、通貨、タイムゾーン情報を一元管理
 */

export interface CountryInfo {
  code: string
  name: string
  nameJa: string
  currency: string
  timezones: string[] // 国内の複数タイムゾーンに対応
  defaultTimezone: string
}

export interface CityInfo {
  name: string
  countryCode: string
  timezone: string
  currency: string
}

// 国別統合データ
export const COUNTRIES: Record<string, CountryInfo> = {
  // アジア
  JP: { code: 'JP', name: 'Japan', nameJa: '日本', currency: 'JPY', timezones: ['Asia/Tokyo'], defaultTimezone: 'Asia/Tokyo' },
  KR: { code: 'KR', name: 'South Korea', nameJa: '韓国', currency: 'KRW', timezones: ['Asia/Seoul'], defaultTimezone: 'Asia/Seoul' },
  CN: { code: 'CN', name: 'China', nameJa: '中国', currency: 'CNY', timezones: ['Asia/Shanghai'], defaultTimezone: 'Asia/Shanghai' },
  TW: { code: 'TW', name: 'Taiwan', nameJa: '台湾', currency: 'TWD', timezones: ['Asia/Taipei'], defaultTimezone: 'Asia/Taipei' },
  HK: { code: 'HK', name: 'Hong Kong', nameJa: '香港', currency: 'HKD', timezones: ['Asia/Hong_Kong'], defaultTimezone: 'Asia/Hong_Kong' },
  SG: { code: 'SG', name: 'Singapore', nameJa: 'シンガポール', currency: 'SGD', timezones: ['Asia/Singapore'], defaultTimezone: 'Asia/Singapore' },
  TH: { code: 'TH', name: 'Thailand', nameJa: 'タイ', currency: 'THB', timezones: ['Asia/Bangkok'], defaultTimezone: 'Asia/Bangkok' },
  MY: { code: 'MY', name: 'Malaysia', nameJa: 'マレーシア', currency: 'MYR', timezones: ['Asia/Kuala_Lumpur'], defaultTimezone: 'Asia/Kuala_Lumpur' },
  ID: { code: 'ID', name: 'Indonesia', nameJa: 'インドネシア', currency: 'IDR', timezones: ['Asia/Jakarta'], defaultTimezone: 'Asia/Jakarta' },
  PH: { code: 'PH', name: 'Philippines', nameJa: 'フィリピン', currency: 'PHP', timezones: ['Asia/Manila'], defaultTimezone: 'Asia/Manila' },
  VN: { code: 'VN', name: 'Vietnam', nameJa: 'ベトナム', currency: 'VND', timezones: ['Asia/Ho_Chi_Minh'], defaultTimezone: 'Asia/Ho_Chi_Minh' },
  IN: { code: 'IN', name: 'India', nameJa: 'インド', currency: 'INR', timezones: ['Asia/Kolkata'], defaultTimezone: 'Asia/Kolkata' },
  
  // 北米
  US: { code: 'US', name: 'United States', nameJa: 'アメリカ', currency: 'USD', timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'], defaultTimezone: 'America/New_York' },
  CA: { code: 'CA', name: 'Canada', nameJa: 'カナダ', currency: 'CAD', timezones: ['America/Toronto', 'America/Vancouver'], defaultTimezone: 'America/Toronto' },
  MX: { code: 'MX', name: 'Mexico', nameJa: 'メキシコ', currency: 'MXN', timezones: ['America/Mexico_City'], defaultTimezone: 'America/Mexico_City' },
  
  // ヨーロッパ
  GB: { code: 'GB', name: 'United Kingdom', nameJa: 'イギリス', currency: 'GBP', timezones: ['Europe/London'], defaultTimezone: 'Europe/London' },
  FR: { code: 'FR', name: 'France', nameJa: 'フランス', currency: 'EUR', timezones: ['Europe/Paris'], defaultTimezone: 'Europe/Paris' },
  DE: { code: 'DE', name: 'Germany', nameJa: 'ドイツ', currency: 'EUR', timezones: ['Europe/Berlin'], defaultTimezone: 'Europe/Berlin' },
  IT: { code: 'IT', name: 'Italy', nameJa: 'イタリア', currency: 'EUR', timezones: ['Europe/Rome'], defaultTimezone: 'Europe/Rome' },
  ES: { code: 'ES', name: 'Spain', nameJa: 'スペイン', currency: 'EUR', timezones: ['Europe/Madrid'], defaultTimezone: 'Europe/Madrid' },
  NL: { code: 'NL', name: 'Netherlands', nameJa: 'オランダ', currency: 'EUR', timezones: ['Europe/Amsterdam'], defaultTimezone: 'Europe/Amsterdam' },
  CH: { code: 'CH', name: 'Switzerland', nameJa: 'スイス', currency: 'CHF', timezones: ['Europe/Zurich'], defaultTimezone: 'Europe/Zurich' },
  AT: { code: 'AT', name: 'Austria', nameJa: 'オーストリア', currency: 'EUR', timezones: ['Europe/Vienna'], defaultTimezone: 'Europe/Vienna' },
  BE: { code: 'BE', name: 'Belgium', nameJa: 'ベルギー', currency: 'EUR', timezones: ['Europe/Brussels'], defaultTimezone: 'Europe/Brussels' },
  SE: { code: 'SE', name: 'Sweden', nameJa: 'スウェーデン', currency: 'SEK', timezones: ['Europe/Stockholm'], defaultTimezone: 'Europe/Stockholm' },
  NO: { code: 'NO', name: 'Norway', nameJa: 'ノルウェー', currency: 'NOK', timezones: ['Europe/Oslo'], defaultTimezone: 'Europe/Oslo' },
  DK: { code: 'DK', name: 'Denmark', nameJa: 'デンマーク', currency: 'DKK', timezones: ['Europe/Copenhagen'], defaultTimezone: 'Europe/Copenhagen' },
  FI: { code: 'FI', name: 'Finland', nameJa: 'フィンランド', currency: 'EUR', timezones: ['Europe/Helsinki'], defaultTimezone: 'Europe/Helsinki' },
  PL: { code: 'PL', name: 'Poland', nameJa: 'ポーランド', currency: 'PLN', timezones: ['Europe/Warsaw'], defaultTimezone: 'Europe/Warsaw' },
  CZ: { code: 'CZ', name: 'Czech Republic', nameJa: 'チェコ', currency: 'CZK', timezones: ['Europe/Prague'], defaultTimezone: 'Europe/Prague' },
  HU: { code: 'HU', name: 'Hungary', nameJa: 'ハンガリー', currency: 'HUF', timezones: ['Europe/Budapest'], defaultTimezone: 'Europe/Budapest' },
  RU: { code: 'RU', name: 'Russia', nameJa: 'ロシア', currency: 'RUB', timezones: ['Europe/Moscow'], defaultTimezone: 'Europe/Moscow' },
  
  // オセアニア
  AU: { code: 'AU', name: 'Australia', nameJa: 'オーストラリア', currency: 'AUD', timezones: ['Australia/Sydney', 'Australia/Melbourne'], defaultTimezone: 'Australia/Sydney' },
  NZ: { code: 'NZ', name: 'New Zealand', nameJa: 'ニュージーランド', currency: 'NZD', timezones: ['Pacific/Auckland'], defaultTimezone: 'Pacific/Auckland' },
  
  // 太平洋諸島
  GU: { code: 'GU', name: 'Guam', nameJa: 'グアム', currency: 'USD', timezones: ['Pacific/Guam'], defaultTimezone: 'Pacific/Guam' },
  MP: { code: 'MP', name: 'Northern Mariana Islands', nameJa: 'サイパン', currency: 'USD', timezones: ['Pacific/Saipan'], defaultTimezone: 'Pacific/Saipan' },
  
  // その他
  AE: { code: 'AE', name: 'United Arab Emirates', nameJa: 'アラブ首長国連邦', currency: 'AED', timezones: ['Asia/Dubai'], defaultTimezone: 'Asia/Dubai' },
  SA: { code: 'SA', name: 'Saudi Arabia', nameJa: 'サウジアラビア', currency: 'SAR', timezones: ['Asia/Riyadh'], defaultTimezone: 'Asia/Riyadh' },
  IL: { code: 'IL', name: 'Israel', nameJa: 'イスラエル', currency: 'ILS', timezones: ['Asia/Jerusalem'], defaultTimezone: 'Asia/Jerusalem' },
  TR: { code: 'TR', name: 'Turkey', nameJa: 'トルコ', currency: 'TRY', timezones: ['Europe/Istanbul'], defaultTimezone: 'Europe/Istanbul' },
  ZA: { code: 'ZA', name: 'South Africa', nameJa: '南アフリカ', currency: 'ZAR', timezones: ['Africa/Johannesburg'], defaultTimezone: 'Africa/Johannesburg' },
  BR: { code: 'BR', name: 'Brazil', nameJa: 'ブラジル', currency: 'BRL', timezones: ['America/Sao_Paulo'], defaultTimezone: 'America/Sao_Paulo' },
  AR: { code: 'AR', name: 'Argentina', nameJa: 'アルゼンチン', currency: 'ARS', timezones: ['America/Argentina/Buenos_Aires'], defaultTimezone: 'America/Argentina/Buenos_Aires' },
  CL: { code: 'CL', name: 'Chile', nameJa: 'チリ', currency: 'CLP', timezones: ['America/Santiago'], defaultTimezone: 'America/Santiago' },
  CO: { code: 'CO', name: 'Colombia', nameJa: 'コロンビア', currency: 'COP', timezones: ['America/Bogota'], defaultTimezone: 'America/Bogota' },
  PE: { code: 'PE', name: 'Peru', nameJa: 'ペルー', currency: 'PEN', timezones: ['America/Lima'], defaultTimezone: 'America/Lima' },
}

// 主要都市マッピング（小文字でキー管理）
export const CITIES: Record<string, CityInfo> = {
  // 日本
  'tokyo': { name: '東京', countryCode: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY' },
  'osaka': { name: '大阪', countryCode: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY' },
  'kyoto': { name: '京都', countryCode: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY' },
  'sapporo': { name: '札幌', countryCode: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY' },
  
  // アメリカ
  'new york': { name: 'New York', countryCode: 'US', timezone: 'America/New_York', currency: 'USD' },
  'los angeles': { name: 'Los Angeles', countryCode: 'US', timezone: 'America/Los_Angeles', currency: 'USD' },
  'chicago': { name: 'Chicago', countryCode: 'US', timezone: 'America/Chicago', currency: 'USD' },
  'san francisco': { name: 'San Francisco', countryCode: 'US', timezone: 'America/Los_Angeles', currency: 'USD' },
  'las vegas': { name: 'Las Vegas', countryCode: 'US', timezone: 'America/Los_Angeles', currency: 'USD' },
  'miami': { name: 'Miami', countryCode: 'US', timezone: 'America/New_York', currency: 'USD' },
  
  // ヨーロッパ
  'london': { name: 'London', countryCode: 'GB', timezone: 'Europe/London', currency: 'GBP' },
  'paris': { name: 'Paris', countryCode: 'FR', timezone: 'Europe/Paris', currency: 'EUR' },
  'rome': { name: 'Rome', countryCode: 'IT', timezone: 'Europe/Rome', currency: 'EUR' },
  'berlin': { name: 'Berlin', countryCode: 'DE', timezone: 'Europe/Berlin', currency: 'EUR' },
  'madrid': { name: 'Madrid', countryCode: 'ES', timezone: 'Europe/Madrid', currency: 'EUR' },
  'amsterdam': { name: 'Amsterdam', countryCode: 'NL', timezone: 'Europe/Amsterdam', currency: 'EUR' },
  
  // アジア
  'seoul': { name: 'Seoul', countryCode: 'KR', timezone: 'Asia/Seoul', currency: 'KRW' },
  'beijing': { name: 'Beijing', countryCode: 'CN', timezone: 'Asia/Shanghai', currency: 'CNY' },
  'shanghai': { name: 'Shanghai', countryCode: 'CN', timezone: 'Asia/Shanghai', currency: 'CNY' },
  'hong kong': { name: 'Hong Kong', countryCode: 'HK', timezone: 'Asia/Hong_Kong', currency: 'HKD' },
  'singapore': { name: 'Singapore', countryCode: 'SG', timezone: 'Asia/Singapore', currency: 'SGD' },
  'bangkok': { name: 'Bangkok', countryCode: 'TH', timezone: 'Asia/Bangkok', currency: 'THB' },
  'taipei': { name: 'Taipei', countryCode: 'TW', timezone: 'Asia/Taipei', currency: 'TWD' },
  
  // オセアニア
  'sydney': { name: 'Sydney', countryCode: 'AU', timezone: 'Australia/Sydney', currency: 'AUD' },
  'melbourne': { name: 'Melbourne', countryCode: 'AU', timezone: 'Australia/Melbourne', currency: 'AUD' },
  'auckland': { name: 'Auckland', countryCode: 'NZ', timezone: 'Pacific/Auckland', currency: 'NZD' },
  
  // 太平洋諸島
  'honolulu': { name: 'Honolulu', countryCode: 'US', timezone: 'Pacific/Honolulu', currency: 'USD' },
  'guam': { name: 'Guam', countryCode: 'GU', timezone: 'Pacific/Guam', currency: 'USD' },
  'saipan': { name: 'Saipan', countryCode: 'MP', timezone: 'Pacific/Saipan', currency: 'USD' },
  
  // インド・南アジア
  'mumbai': { name: 'Mumbai', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  'delhi': { name: 'Delhi', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  'bangalore': { name: 'Bangalore', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  'chennai': { name: 'Chennai', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  'kolkata': { name: 'Kolkata', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  
  // その他
  'dubai': { name: 'Dubai', countryCode: 'AE', timezone: 'Asia/Dubai', currency: 'AED' },
  'moscow': { name: 'Moscow', countryCode: 'RU', timezone: 'Europe/Moscow', currency: 'RUB' },
  'istanbul': { name: 'Istanbul', countryCode: 'TR', timezone: 'Europe/Istanbul', currency: 'TRY' },
}

// ヘルパー関数
export function getCountryInfo(countryCode: string): CountryInfo | null {
  return COUNTRIES[countryCode.toUpperCase()] || null
}

export function getCityInfo(cityName: string): CityInfo | null {
  return CITIES[cityName.toLowerCase()] || null
}

export function getCurrencyByCountryCode(countryCode: string): string | null {
  const country = getCountryInfo(countryCode)
  return country?.currency || null
}

export function getTimezoneByCountryCode(countryCode: string): string | null {
  const country = getCountryInfo(countryCode)
  return country?.defaultTimezone || null
}

export function getCurrencyByCityName(cityName: string): string | null {
  const city = getCityInfo(cityName)
  return city?.currency || null
}

export function getTimezoneByCityName(cityName: string): string | null {
  const city = getCityInfo(cityName)
  return city?.timezone || null
}

