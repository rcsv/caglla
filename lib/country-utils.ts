// 国名抽出とグループ化のユーティリティ関数
import { PlaceData } from './firestore'
import logger from './logger'
import { geocodingApiHelpers } from './geocoding-api'

// 国名のマッピング（英語→日本語）
const COUNTRY_NAMES: { [key: string]: string } = {
  'Japan': '日本',
  'United States': '米国',
  'United Kingdom': 'イギリス',
  'Germany': 'ドイツ',
  'France': 'フランス',
  'Italy': 'イタリア',
  'Spain': 'スペイン',
  'China': '中国',
  'South Korea': '韓国',
  'Thailand': 'タイ',
  'Singapore': 'シンガポール',
  'Malaysia': 'マレーシア',
  'Indonesia': 'インドネシア',
  'Philippines': 'フィリピン',
  'Vietnam': 'ベトナム',
  'India': 'インド',
  'Australia': 'オーストラリア',
  'New Zealand': 'ニュージーランド',
  'Canada': 'カナダ',
  'Brazil': 'ブラジル',
  'Mexico': 'メキシコ',
  'Argentina': 'アルゼンチン',
  'Chile': 'チリ',
  'Peru': 'ペルー',
  'South Africa': '南アフリカ',
  'Egypt': 'エジプト',
  'Morocco': 'モロッコ',
  'Turkey': 'トルコ',
  'Russia': 'ロシア',
  'Poland': 'ポーランド',
  'Czech Republic': 'チェコ',
  'Hungary': 'ハンガリー',
  'Austria': 'オーストリア',
  'Switzerland': 'スイス',
  'Netherlands': 'オランダ',
  'Belgium': 'ベルギー',
  'Denmark': 'デンマーク',
  'Sweden': 'スウェーデン',
  'Norway': 'ノルウェー',
  'Finland': 'フィンランド',
  'Iceland': 'アイスランド',
  'Ireland': 'アイルランド',
  'Portugal': 'ポルトガル',
  'Greece': 'ギリシャ',
  'Croatia': 'クロアチア',
  'Slovenia': 'スロベニア',
  'Slovakia': 'スロバキア',
  'Estonia': 'エストニア',
  'Latvia': 'ラトビア',
  'Lithuania': 'リトアニア',
  'Ukraine': 'ウクライナ',
  'Romania': 'ルーマニア',
  'Bulgaria': 'ブルガリア',
  'Serbia': 'セルビア',
  'Montenegro': 'モンテネグロ',
  'Bosnia and Herzegovina': 'ボスニア・ヘルツェゴビナ',
  'North Macedonia': '北マケドニア',
  'Albania': 'アルバニア',
  'Kosovo': 'コソボ',
  'Moldova': 'モルドバ',
  'Belarus': 'ベラルーシ',
  'Georgia': 'ジョージア',
  'Armenia': 'アルメニア',
  'Azerbaijan': 'アゼルバイジャン',
  'Kazakhstan': 'カザフスタン',
  'Uzbekistan': 'ウズベキスタン',
  'Kyrgyzstan': 'キルギス',
  'Tajikistan': 'タジキスタン',
  'Turkmenistan': 'トルクメニスタン',
  'Afghanistan': 'アフガニスタン',
  'Pakistan': 'パキスタン',
  'Bangladesh': 'バングラデシュ',
  'Sri Lanka': 'スリランカ',
  'Nepal': 'ネパール',
  'Bhutan': 'ブータン',
  'Maldives': 'モルディブ',
  'Myanmar': 'ミャンマー',
  'Laos': 'ラオス',
  'Cambodia': 'カンボジア',
  'Brunei': 'ブルネイ',
  'East Timor': '東ティモール',
  'Mongolia': 'モンゴル',
  'North Korea': '北朝鮮',
  'Taiwan': '台湾',
  'Hong Kong': '香港',
  'Macau': 'マカオ',
  'Israel': 'イスラエル',
  'Palestine': 'パレスチナ',
  'Jordan': 'ヨルダン',
  'Lebanon': 'レバノン',
  'Syria': 'シリア',
  'Iraq': 'イラク',
  'Iran': 'イラン',
  'Saudi Arabia': 'サウジアラビア',
  'United Arab Emirates': 'アラブ首長国連邦',
  'Qatar': 'カタール',
  'Kuwait': 'クウェート',
  'Bahrain': 'バーレーン',
  'Oman': 'オマーン',
  'Yemen': 'イエメン',
  'Cyprus': 'キプロス',
  'Libya': 'リビア',
  'Tunisia': 'チュニジア',
  'Algeria': 'アルジェリア',
  'Sudan': 'スーダン',
  'South Sudan': '南スーダン',
  'Ethiopia': 'エチオピア',
  'Eritrea': 'エリトリア',
  'Djibouti': 'ジブチ',
  'Somalia': 'ソマリア',
  'Kenya': 'ケニア',
  'Uganda': 'ウガンダ',
  'Tanzania': 'タンザニア',
  'Rwanda': 'ルワンダ',
  'Burundi': 'ブルンジ',
  'Democratic Republic of the Congo': 'コンゴ民主共和国',
  'Republic of the Congo': 'コンゴ共和国',
  'Central African Republic': '中央アフリカ共和国',
  'Chad': 'チャド',
  'Cameroon': 'カメルーン',
  'Nigeria': 'ナイジェリア',
  'Niger': 'ニジェール',
  'Mali': 'マリ',
  'Burkina Faso': 'ブルキナファソ',
  'Ghana': 'ガーナ',
  'Togo': 'トーゴ',
  'Benin': 'ベナン',
  'Côte d\'Ivoire': 'コートジボワール',
  'Liberia': 'リベリア',
  'Sierra Leone': 'シエラレオネ',
  'Guinea': 'ギニア',
  'Guinea-Bissau': 'ギニアビサウ',
  'Senegal': 'セネガル',
  'Gambia': 'ガンビア',
  'Mauritania': 'モーリタニア',
  'Cape Verde': 'カーボベルデ',
  'São Tomé and Príncipe': 'サントメ・プリンシペ',
  'Equatorial Guinea': '赤道ギニア',
  'Gabon': 'ガボン',
  'Angola': 'アンゴラ',
  'Zambia': 'ザンビア',
  'Zimbabwe': 'ジンバブエ',
  'Botswana': 'ボツワナ',
  'Namibia': 'ナミビア',
  'Lesotho': 'レソト',
  'Swaziland': 'スワジランド',
  'Madagascar': 'マダガスカル',
  'Mauritius': 'モーリシャス',
  'Seychelles': 'セーシェル',
  'Comoros': 'コモロ',
  'Malawi': 'マラウイ',
  'Mozambique': 'モザンビーク'
}

import type { CountryGroup } from './types'

// Re-export types for backward compatibility
export type { CountryGroup }

/**
 * Google Places APIのaddress_componentsから国名を抽出する
 */
export function extractCountryFromAddressComponents(addressComponents: Array<{
  long_name: string
  short_name: string
  types: string[]
}>): { countryCode: string; countryName: string } {
  if (!addressComponents || addressComponents.length === 0) {
    return { countryCode: 'unknown', countryName: '不明' }
  }

  // address_componentsから国（country）を検索
  const countryComponent = addressComponents.find(component => 
    component.types.includes('country')
  )

  if (countryComponent) {
    const countryName = countryComponent.long_name
    const countryCode = countryComponent.short_name.toLowerCase()
    
    return { countryCode, countryName }
  }

  return { countryCode: 'unknown', countryName: '不明' }
}

// 手動マッピングは不要になりました
// Google Places API + Geocoding APIで自動的に国情報を取得します

/**
 * Google Places APIのformatted_addressから国名を抽出する
 * Geocoding APIを使用してaddress_componentsを取得し、国情報を抽出します
 */
export async function extractCountryFromAddress(formattedAddress: string): Promise<{ countryCode: string; countryName: string }> {
  if (!formattedAddress) {
    return { countryCode: 'unknown', countryName: '不明' }
  }

  logger.debug('extractCountryFromAddress input:', formattedAddress)

  try {
    // Geocoding APIを使用してaddress_componentsを取得
    const geocodingResults = await geocodingApiHelpers.geocodeAddress(formattedAddress)
    
    if (geocodingResults.length > 0) {
      const result = geocodingResults[0]
      logger.debug('Geocoding result:', result)
      
      // address_componentsから国を抽出
      const countryInfo = extractCountryFromAddressComponents(result.address_components)
      if (countryInfo.countryCode !== 'unknown') {
        logger.debug('Found country via Geocoding API:', countryInfo)
        return countryInfo
      }
    }
  } catch (error) {
    logger.warn('Geocoding API failed:', error)
  }

  // Geocoding APIが失敗した場合は「不明」として扱う
  logger.debug('No country found for:', formattedAddress, 'using unknown')
  return { countryCode: 'unknown', countryName: '不明' }
}

/**
 * 旅行データを国別にグループ化する
 */
export async function groupTripsByCountry(trips: Array<{
  id: string
  title: string
  destination?: string
  destinationPlace?: PlaceData
  startDate?: Date
  endDate?: Date
  imageUrl?: string
}>): Promise<CountryGroup[]> {
  const countryMap = new Map<string, CountryGroup>()

  logger.debug('=== groupTripsByCountry Debug ===')
  logger.debug('Total trips:', trips.length)
  trips.forEach((trip, index) => {
    logger.debug(`Trip ${index + 1}:`, {
      title: trip.title,
      destination: trip.destination,
      destinationPlace: trip.destinationPlace ? {
        name: trip.destinationPlace.name,
        formatted_address: trip.destinationPlace.formatted_address,
        address_components: trip.destinationPlace.address_components
      } : null
    })
  })

  // 各旅行を順次処理（非同期処理のため）
  for (const trip of trips) {
    let countryCode = 'unknown'
    let countryName = '不明'
    let countryNameJa = '不明'

    logger.debug(`Processing trip: ${trip.title}`)
    logger.debug('destinationPlace:', trip.destinationPlace)
    logger.debug('destination:', trip.destination)

    if (trip.destinationPlace) {
      // address_componentsがある場合はそれを使用（より正確）
      if (trip.destinationPlace.address_components) {
        logger.debug('Using address_components')
        const countryInfo = extractCountryFromAddressComponents(trip.destinationPlace.address_components)
        countryCode = countryInfo.countryCode
        countryName = countryInfo.countryName
        countryNameJa = COUNTRY_NAMES[countryName] || countryName
        logger.debug('Country from address_components:', countryInfo)
      } else if (trip.destinationPlace.formatted_address) {
        logger.debug('Using formatted_address with Geocoding API')
        // address_componentsがない場合はformatted_addressから推測（Geocoding API使用）
        const countryInfo = await extractCountryFromAddress(trip.destinationPlace.formatted_address)
        countryCode = countryInfo.countryCode
        countryName = countryInfo.countryName
        countryNameJa = COUNTRY_NAMES[countryName] || countryName
        logger.debug('Country from formatted_address:', countryInfo)
      }
    } else if (trip.destination) {
      logger.debug('Using destination string with Geocoding API')
      // destinationPlaceがない場合は、destinationから推測（Geocoding API使用）
      const countryInfo = await extractCountryFromAddress(trip.destination)
      countryCode = countryInfo.countryCode
      countryName = countryInfo.countryName
      countryNameJa = COUNTRY_NAMES[countryName] || countryName
      logger.debug('Country from destination:', countryInfo)
    }

    logger.debug(`Final country info: ${countryCode} - ${countryName} (${countryNameJa})`)

    if (!countryMap.has(countryCode)) {
      countryMap.set(countryCode, {
        countryCode,
        countryName,
        countryNameJa,
        tripCount: 0,
        trips: []
      })
    }

    const countryGroup = countryMap.get(countryCode)!
    countryGroup.tripCount++
    countryGroup.trips.push({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      imageUrl: trip.imageUrl
    })
  }

  logger.debug('Final country groups:', Array.from(countryMap.values()))

  // 旅行数でソート（多い順）
  const result = Array.from(countryMap.values()).sort((a, b) => b.tripCount - a.tripCount)
  logger.debug('Sorted result:', result)
  return result
}

/**
 * 国名を日本語に変換する
 */
export function getCountryNameJa(countryName: string): string {
  return COUNTRY_NAMES[countryName] || countryName
}

/**
 * 国コードから日本語名を取得する
 */
export function getCountryNameJaByCode(countryCode: string): string {
  const englishName = Object.keys(COUNTRY_NAMES).find(
    key => key.toLowerCase().replace(/\s+/g, '-') === countryCode
  )
  return englishName ? COUNTRY_NAMES[englishName] : countryCode
}
