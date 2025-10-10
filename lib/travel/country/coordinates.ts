// 各国の座標データとマッピング機能

import type { CountryCoordinate } from '@/lib/core/types'

// 主要国の座標データ
export const COUNTRY_COORDINATES: CountryCoordinate[] = [
  // アジア
  { countryCode: 'JP', countryName: 'Japan', countryNameJa: '日本', lat: 35.6762, lng: 139.6503 },
  { countryCode: 'KR', countryName: 'South Korea', countryNameJa: '韓国', lat: 37.5665, lng: 126.9780 },
  { countryCode: 'CN', countryName: 'China', countryNameJa: '中国', lat: 39.9042, lng: 116.4074 },
  { countryCode: 'TW', countryName: 'Taiwan', countryNameJa: '台湾', lat: 25.0330, lng: 121.5654 },
  { countryCode: 'HK', countryName: 'Hong Kong', countryNameJa: '香港', lat: 22.3193, lng: 114.1694 },
  { countryCode: 'SG', countryName: 'Singapore', countryNameJa: 'シンガポール', lat: 1.3521, lng: 103.8198 },
  { countryCode: 'TH', countryName: 'Thailand', countryNameJa: 'タイ', lat: 13.7563, lng: 100.5018 },
  { countryCode: 'MY', countryName: 'Malaysia', countryNameJa: 'マレーシア', lat: 3.1390, lng: 101.6869 },
  { countryCode: 'ID', countryName: 'Indonesia', countryNameJa: 'インドネシア', lat: -6.2088, lng: 106.8456 },
  { countryCode: 'PH', countryName: 'Philippines', countryNameJa: 'フィリピン', lat: 14.5995, lng: 120.9842 },
  { countryCode: 'VN', countryName: 'Vietnam', countryNameJa: 'ベトナム', lat: 21.0285, lng: 105.8542 },
  { countryCode: 'IN', countryName: 'India', countryNameJa: 'インド', lat: 28.6139, lng: 77.2090 },
  
  // 北米
  { countryCode: 'US', countryName: 'United States', countryNameJa: 'アメリカ', lat: 39.8283, lng: -98.5795 },
  { countryCode: 'CA', countryName: 'Canada', countryNameJa: 'カナダ', lat: 56.1304, lng: -106.3468 },
  { countryCode: 'MX', countryName: 'Mexico', countryNameJa: 'メキシコ', lat: 23.6345, lng: -102.5528 },
  
  // ヨーロッパ
  { countryCode: 'GB', countryName: 'United Kingdom', countryNameJa: 'イギリス', lat: 55.3781, lng: -3.4360 },
  { countryCode: 'FR', countryName: 'France', countryNameJa: 'フランス', lat: 46.2276, lng: 2.2137 },
  { countryCode: 'DE', countryName: 'Germany', countryNameJa: 'ドイツ', lat: 51.1657, lng: 10.4515 },
  { countryCode: 'IT', countryName: 'Italy', countryNameJa: 'イタリア', lat: 41.8719, lng: 12.5674 },
  { countryCode: 'ES', countryName: 'Spain', countryNameJa: 'スペイン', lat: 40.4637, lng: -3.7492 },
  { countryCode: 'NL', countryName: 'Netherlands', countryNameJa: 'オランダ', lat: 52.1326, lng: 5.2913 },
  { countryCode: 'CH', countryName: 'Switzerland', countryNameJa: 'スイス', lat: 46.8182, lng: 8.2275 },
  { countryCode: 'AT', countryName: 'Austria', countryNameJa: 'オーストリア', lat: 47.5162, lng: 14.5501 },
  
  // オセアニア
  { countryCode: 'AU', countryName: 'Australia', countryNameJa: 'オーストラリア', lat: -25.2744, lng: 133.7751 },
  { countryCode: 'NZ', countryName: 'New Zealand', countryNameJa: 'ニュージーランド', lat: -40.9006, lng: 174.8860 },
  
  // その他
  { countryCode: 'BR', countryName: 'Brazil', countryNameJa: 'ブラジル', lat: -14.2350, lng: -51.9253 },
  { countryCode: 'AR', countryName: 'Argentina', countryNameJa: 'アルゼンチン', lat: -38.4161, lng: -63.6167 },
  { countryCode: 'RU', countryName: 'Russia', countryNameJa: 'ロシア', lat: 61.5240, lng: 105.3188 },
  { countryCode: 'ZA', countryName: 'South Africa', countryNameJa: '南アフリカ', lat: -30.5595, lng: 22.9375 },
  { countryCode: 'EG', countryName: 'Egypt', countryNameJa: 'エジプト', lat: 26.0975, lng: 30.0444 },
  { countryCode: 'TR', countryName: 'Turkey', countryNameJa: 'トルコ', lat: 38.9637, lng: 35.2433 },
]

// 国コードから座標を取得する関数
export function getCountryCoordinate(countryCode: string): CountryCoordinate | null {
  // まず標準的な国コードで検索
  let coordinate = COUNTRY_COORDINATES.find(country => 
    country.countryCode.toLowerCase() === countryCode.toLowerCase()
  )
  
  if (coordinate) return coordinate
  
  // country-utils.tsで生成される形式（例: "united-states", "japan"）で検索
  const countryNameMapping: { [key: string]: string } = {
    'united-states': 'US',
    'japan': 'JP',
    'south-korea': 'KR',
    'china': 'CN',
    'taiwan': 'TW',
    'hong-kong': 'HK',
    'singapore': 'SG',
    'thailand': 'TH',
    'malaysia': 'MY',
    'indonesia': 'ID',
    'philippines': 'PH',
    'vietnam': 'VN',
    'india': 'IN',
    'canada': 'CA',
    'mexico': 'MX',
    'united-kingdom': 'GB',
    'france': 'FR',
    'germany': 'DE',
    'italy': 'IT',
    'spain': 'ES',
    'netherlands': 'NL',
    'switzerland': 'CH',
    'austria': 'AT',
    'australia': 'AU',
    'new-zealand': 'NZ',
    'brazil': 'BR',
    'argentina': 'AR',
    'russia': 'RU',
    'south-africa': 'ZA',
    'egypt': 'EG',
    'turkey': 'TR'
  }
  
  const mappedCode = countryNameMapping[countryCode.toLowerCase()]
  if (mappedCode) {
    coordinate = COUNTRY_COORDINATES.find(country => 
      country.countryCode === mappedCode
    )
  }
  
  return coordinate || null
}

// 複数の国コードから座標を取得する関数
export function getCountryCoordinates(countryCodes: string[]): CountryCoordinate[] {
  return countryCodes
    .map(code => getCountryCoordinate(code))
    .filter((coord): coord is CountryCoordinate => coord !== null)
}

// 国別統計データに座標情報を追加する関数
export function addCoordinatesToCountryGroups(countryGroups: any[]): any[] {
  return countryGroups.map(group => {
    const coordinate = getCountryCoordinate(group.countryCode)
    return {
      ...group,
      coordinate: coordinate ? { lat: coordinate.lat, lng: coordinate.lng } : null
    }
  })
}
