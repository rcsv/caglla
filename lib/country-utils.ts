// 国名抽出とグループ化のユーティリティ関数
import { PlaceData } from './firestore'

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
  'Iraq': 'イラク',
  'Syria': 'シリア',
  'Lebanon': 'レバノン',
  'Jordan': 'ヨルダン',
  'Israel': 'イスラエル',
  'Palestine': 'パレスチナ',
  'Cyprus': 'キプロス',
  'Turkey': 'トルコ',
  'Georgia': 'ジョージア',
  'Armenia': 'アルメニア',
  'Azerbaijan': 'アゼルバイジャン',
  'Iran': 'イラン',
  'Iraq': 'イラク',
  'Syria': 'シリア',
  'Lebanon': 'レバノン',
  'Jordan': 'ヨルダン',
  'Israel': 'イスラエル',
  'Palestine': 'パレスチナ',
  'Saudi Arabia': 'サウジアラビア',
  'United Arab Emirates': 'アラブ首長国連邦',
  'Qatar': 'カタール',
  'Kuwait': 'クウェート',
  'Bahrain': 'バーレーン',
  'Oman': 'オマーン',
  'Yemen': 'イエメン',
  'Egypt': 'エジプト',
  'Libya': 'リビア',
  'Tunisia': 'チュニジア',
  'Algeria': 'アルジェリア',
  'Morocco': 'モロッコ',
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
  'South Africa': '南アフリカ',
  'Lesotho': 'レソト',
  'Swaziland': 'スワジランド',
  'Madagascar': 'マダガスカル',
  'Mauritius': 'モーリシャス',
  'Seychelles': 'セーシェル',
  'Comoros': 'コモロ',
  'Malawi': 'マラウイ',
  'Mozambique': 'モザンビーク',
  'Zambia': 'ザンビア',
  'Zimbabwe': 'ジンバブエ',
  'Botswana': 'ボツワナ',
  'Namibia': 'ナミビア',
  'South Africa': '南アフリカ',
  'Lesotho': 'レソト',
  'Swaziland': 'スワジランド',
  'Madagascar': 'マダガスカル',
  'Mauritius': 'モーリシャス',
  'Seychelles': 'セーシェル',
  'Comoros': 'コモロ',
  'Malawi': 'マラウイ',
  'Mozambique': 'モザンビーク'
}

export interface CountryGroup {
  countryCode: string
  countryName: string
  countryNameJa: string
  tripCount: number
  trips: Array<{
    id: string
    title: string
    destination: string
    startDate?: Date
    endDate?: Date
    imageUrl?: string
  }>
}

/**
 * Google Places APIのaddress_componentsから国名を抽出する
 */
export function extractCountryFromAddressComponents(addressComponents: any[]): { countryCode: string; countryName: string } {
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

// 地名から国を推測するマッピング
const LOCATION_TO_COUNTRY: { [key: string]: string } = {
  // ハワイ関連
  'ラニカイ': 'United States',
  'ワイキキ': 'United States', 
  'ホノルル': 'United States',
  'ハワイ': 'United States',
  'オアフ島': 'United States',
  'マウイ島': 'United States',
  'ハワイ島': 'United States',
  'カウアイ島': 'United States',
  'Lanikai': 'United States',
  'Waikiki': 'United States',
  'Honolulu': 'United States',
  'Hawaii': 'United States',
  'Oahu': 'United States',
  'Maui': 'United States',
  'Kauai': 'United States',
  
  // 日本関連
  '知立市': 'Japan',
  '知立': 'Japan',
  'Chiryu': 'Japan',
  '東京': 'Japan',
  '大阪': 'Japan',
  '京都': 'Japan',
  '名古屋': 'Japan',
  '横浜': 'Japan',
  '神戸': 'Japan',
  '福岡': 'Japan',
  '札幌': 'Japan',
  '沖縄': 'Japan',
  '那覇': 'Japan',
  'Tokyo': 'Japan',
  'Osaka': 'Japan',
  'Kyoto': 'Japan',
  'Nagoya': 'Japan',
  'Yokohama': 'Japan',
  'Kobe': 'Japan',
  'Fukuoka': 'Japan',
  'Sapporo': 'Japan',
  'Okinawa': 'Japan',
  'Naha': 'Japan',
  
  // その他の主要都市
  'New York': 'United States',
  'Los Angeles': 'United States',
  'San Francisco': 'United States',
  'Las Vegas': 'United States',
  'Miami': 'United States',
  'Chicago': 'United States',
  'Boston': 'United States',
  'Seattle': 'United States',
  'London': 'United Kingdom',
  'Paris': 'France',
  'Rome': 'Italy',
  'Barcelona': 'Spain',
  'Berlin': 'Germany',
  'Amsterdam': 'Netherlands',
  'Vienna': 'Austria',
  'Prague': 'Czech Republic',
  'Budapest': 'Hungary',
  'Warsaw': 'Poland',
  'Moscow': 'Russia',
  'Istanbul': 'Turkey',
  'Dubai': 'United Arab Emirates',
  'Singapore': 'Singapore',
  'Hong Kong': 'Hong Kong',
  'Seoul': 'South Korea',
  'Bangkok': 'Thailand',
  'Kuala Lumpur': 'Malaysia',
  'Jakarta': 'Indonesia',
  'Manila': 'Philippines',
  'Ho Chi Minh City': 'Vietnam',
  'Hanoi': 'Vietnam',
  'Mumbai': 'India',
  'Delhi': 'India',
  'Sydney': 'Australia',
  'Melbourne': 'Australia',
  'Auckland': 'New Zealand',
  'Toronto': 'Canada',
  'Vancouver': 'Canada',
  'São Paulo': 'Brazil',
  'Rio de Janeiro': 'Brazil',
  'Mexico City': 'Mexico',
  'Buenos Aires': 'Argentina',
  'Santiago': 'Chile',
  'Lima': 'Peru',
  'Cape Town': 'South Africa',
  'Cairo': 'Egypt',
  'Marrakech': 'Morocco',
  'Casablanca': 'Morocco'
}

/**
 * Google Places APIのformatted_addressから国名を抽出する（フォールバック用）
 */
export function extractCountryFromAddress(formattedAddress: string): { countryCode: string; countryName: string } {
  if (!formattedAddress) {
    return { countryCode: 'unknown', countryName: '不明' }
  }

  console.log('extractCountryFromAddress input:', formattedAddress)

  // 住所の最後の部分（通常は国名）を取得
  const addressParts = formattedAddress.split(',').map(part => part.trim())
  const lastPart = addressParts[addressParts.length - 1]

  console.log('Address parts:', addressParts)
  console.log('Last part:', lastPart)

  // 国名のマッピングから検索
  for (const [englishName, japaneseName] of Object.entries(COUNTRY_NAMES)) {
    if (lastPart.includes(englishName)) {
      console.log('Found country by English name:', englishName)
      return { countryCode: englishName.toLowerCase().replace(/\s+/g, '-'), countryName: englishName }
    }
  }

  // 日本語名で検索
  for (const [englishName, japaneseName] of Object.entries(COUNTRY_NAMES)) {
    if (lastPart.includes(japaneseName)) {
      console.log('Found country by Japanese name:', japaneseName)
      return { countryCode: englishName.toLowerCase().replace(/\s+/g, '-'), countryName: englishName }
    }
  }

  // 地名から国を推測
  for (const [location, country] of Object.entries(LOCATION_TO_COUNTRY)) {
    if (formattedAddress.includes(location)) {
      console.log('Found country by location:', location, '->', country)
      return { countryCode: country.toLowerCase().replace(/\s+/g, '-'), countryName: country }
    }
  }

  // 見つからない場合は最後の部分をそのまま使用
  console.log('No country found, using last part:', lastPart)
  return { countryCode: lastPart.toLowerCase().replace(/\s+/g, '-'), countryName: lastPart }
}

/**
 * 旅行データを国別にグループ化する
 */
export function groupTripsByCountry(trips: Array<{
  id: string
  title: string
  destination: string
  destinationPlace?: PlaceData & { address_components?: any[] }
  startDate?: Date
  endDate?: Date
  imageUrl?: string
}>): CountryGroup[] {
  const countryMap = new Map<string, CountryGroup>()

  console.log('=== groupTripsByCountry Debug ===')
  console.log('Total trips:', trips.length)
  trips.forEach((trip, index) => {
    console.log(`Trip ${index + 1}:`, {
      title: trip.title,
      destination: trip.destination,
      destinationPlace: trip.destinationPlace ? {
        name: trip.destinationPlace.name,
        formatted_address: trip.destinationPlace.formatted_address,
        address_components: trip.destinationPlace.address_components
      } : null
    })
  })

  trips.forEach(trip => {
    let countryCode = 'unknown'
    let countryName = '不明'
    let countryNameJa = '不明'

    console.log(`Processing trip: ${trip.title}`)
    console.log('destinationPlace:', trip.destinationPlace)
    console.log('destination:', trip.destination)

    if (trip.destinationPlace) {
      // address_componentsがある場合はそれを使用（より正確）
      if (trip.destinationPlace.address_components) {
        console.log('Using address_components')
        const countryInfo = extractCountryFromAddressComponents(trip.destinationPlace.address_components)
        countryCode = countryInfo.countryCode
        countryName = countryInfo.countryName
        countryNameJa = COUNTRY_NAMES[countryName] || countryName
        console.log('Country from address_components:', countryInfo)
      } else if (trip.destinationPlace.formatted_address) {
        console.log('Using formatted_address')
        // address_componentsがない場合はformatted_addressから推測
        const countryInfo = extractCountryFromAddress(trip.destinationPlace.formatted_address)
        countryCode = countryInfo.countryCode
        countryName = countryInfo.countryName
        countryNameJa = COUNTRY_NAMES[countryName] || countryName
        console.log('Country from formatted_address:', countryInfo)
      }
    } else if (trip.destination) {
      console.log('Using destination string')
      // destinationPlaceがない場合は、destinationから推測
      const countryInfo = extractCountryFromAddress(trip.destination)
      countryCode = countryInfo.countryCode
      countryName = countryInfo.countryName
      countryNameJa = COUNTRY_NAMES[countryName] || countryName
      console.log('Country from destination:', countryInfo)
    }

    console.log(`Final country info: ${countryCode} - ${countryName} (${countryNameJa})`)

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
  })

  console.log('Final country groups:', Array.from(countryMap.values()))

  // 旅行数でソート（多い順）
  const result = Array.from(countryMap.values()).sort((a, b) => b.tripCount - a.tripCount)
  console.log('Sorted result:', result)
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
