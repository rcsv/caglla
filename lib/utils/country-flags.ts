// 国情報の包括的なユーティリティ関数（国旗、国名、座標など）

/**
 * 国情報のインターフェース
 */
export interface CountryInfo {
  countryCode: string
  countryName: string
  countryNameJa: string
  flag: string
  coordinates?: {
    lat: number
    lng: number
  }
}

/**
 * ISO 3166-1 alpha-2 国コードから国旗絵文字を取得する
 * Unicode Regional Indicator Symbolsを使用して国旗絵文字を生成
 */
export function getCountryFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode === 'unknown') {
    return '🏳️' // 白旗（不明な国）
  }

  // 国コードを大文字に変換
  const code = countryCode.toUpperCase()
  
  // 2文字の国コードでない場合は白旗を返す
  if (code.length !== 2) {
    return '🏳️'
  }

  // Unicode Regional Indicator Symbolsを使用して国旗絵文字を生成
  // A = U+1F1E6, B = U+1F1E7, ..., Z = U+1F1FF
  const firstChar = String.fromCodePoint(0x1F1E6 + (code.charCodeAt(0) - 65))
  const secondChar = String.fromCodePoint(0x1F1E6 + (code.charCodeAt(1) - 65))
  
  return firstChar + secondChar
}

/**
 * 主要国の国旗絵文字マッピング（フォールバック用）
 */
const COUNTRY_FLAG_MAP: { [key: string]: string } = {
  'JP': '🇯🇵', // 日本
  'US': '🇺🇸', // アメリカ合衆国
  'GB': '🇬🇧', // イギリス
  'DE': '🇩🇪', // ドイツ
  'FR': '🇫🇷', // フランス
  'IT': '🇮🇹', // イタリア
  'ES': '🇪🇸', // スペイン
  'CN': '🇨🇳', // 中国
  'KR': '🇰🇷', // 韓国
  'TH': '🇹🇭', // タイ
  'SG': '🇸🇬', // シンガポール
  'MY': '🇲🇾', // マレーシア
  'ID': '🇮🇩', // インドネシア
  'PH': '🇵🇭', // フィリピン
  'VN': '🇻🇳', // ベトナム
  'IN': '🇮🇳', // インド
  'AU': '🇦🇺', // オーストラリア
  'NZ': '🇳🇿', // ニュージーランド
  'CA': '🇨🇦', // カナダ
  'BR': '🇧🇷', // ブラジル
  'MX': '🇲🇽', // メキシコ
  'AR': '🇦🇷', // アルゼンチン
  'CL': '🇨🇱', // チリ
  'PE': '🇵🇪', // ペルー
  'ZA': '🇿🇦', // 南アフリカ
  'EG': '🇪🇬', // エジプト
  'MA': '🇲🇦', // モロッコ
  'TR': '🇹🇷', // トルコ
  'RU': '🇷🇺', // ロシア
  'PL': '🇵🇱', // ポーランド
  'CZ': '🇨🇿', // チェコ
  'HU': '🇭🇺', // ハンガリー
  'AT': '🇦🇹', // オーストリア
  'CH': '🇨🇭', // スイス
  'NL': '🇳🇱', // オランダ
  'BE': '🇧🇪', // ベルギー
  'DK': '🇩🇰', // デンマーク
  'SE': '🇸🇪', // スウェーデン
  'NO': '🇳🇴', // ノルウェー
  'FI': '🇫🇮', // フィンランド
  'IS': '🇮🇸', // アイスランド
  'IE': '🇮🇪', // アイルランド
  'PT': '🇵🇹', // ポルトガル
  'GR': '🇬🇷', // ギリシャ
  'HR': '🇭🇷', // クロアチア
  'SI': '🇸🇮', // スロベニア
  'SK': '🇸🇰', // スロバキア
  'EE': '🇪🇪', // エストニア
  'LV': '🇱🇻', // ラトビア
  'LT': '🇱🇹', // リトアニア
  'UA': '🇺🇦', // ウクライナ
  'RO': '🇷🇴', // ルーマニア
  'BG': '🇧🇬', // ブルガリア
  'RS': '🇷🇸', // セルビア
  'ME': '🇲🇪', // モンテネグロ
  'BA': '🇧🇦', // ボスニア・ヘルツェゴビナ
  'MK': '🇲🇰', // 北マケドニア
  'AL': '🇦🇱', // アルバニア
  'XK': '🇽🇰', // コソボ
  'MD': '🇲🇩', // モルドバ
  'BY': '🇧🇾', // ベラルーシ
  'GE': '🇬🇪', // ジョージア
  'AM': '🇦🇲', // アルメニア
  'AZ': '🇦🇿', // アゼルバイジャン
  'KZ': '🇰🇿', // カザフスタン
  'UZ': '🇺🇿', // ウズベキスタン
  'KG': '🇰🇬', // キルギス
  'TJ': '🇹🇯', // タジキスタン
  'TM': '🇹🇲', // トルクメニスタン
  'AF': '🇦🇫', // アフガニスタン
  'PK': '🇵🇰', // パキスタン
  'BD': '🇧🇩', // バングラデシュ
  'LK': '🇱🇰', // スリランカ
  'NP': '🇳🇵', // ネパール
  'BT': '🇧🇹', // ブータン
  'MV': '🇲🇻', // モルディブ
  'MM': '🇲🇲', // ミャンマー
  'LA': '🇱🇦', // ラオス
  'KH': '🇰🇭', // カンボジア
  'BN': '🇧🇳', // ブルネイ
  'TL': '🇹🇱', // 東ティモール
  'MN': '🇲🇳', // モンゴル
  'KP': '🇰🇵', // 北朝鮮
  'TW': '🇹🇼', // 台湾
  'HK': '🇭🇰', // 香港
  'MO': '🇲🇴', // マカオ
  'IL': '🇮🇱', // イスラエル
  'PS': '🇵🇸', // パレスチナ
  'JO': '🇯🇴', // ヨルダン
  'LB': '🇱🇧', // レバノン
  'SY': '🇸🇾', // シリア
  'IQ': '🇮🇶', // イラク
  'IR': '🇮🇷', // イラン
  'SA': '🇸🇦', // サウジアラビア
  'AE': '🇦🇪', // アラブ首長国連邦
  'QA': '🇶🇦', // カタール
  'KW': '🇰🇼', // クウェート
  'BH': '🇧🇭', // バーレーン
  'OM': '🇴🇲', // オマーン
  'YE': '🇾🇪', // イエメン
  'CY': '🇨🇾', // キプロス
  'LY': '🇱🇾', // リビア
  'TN': '🇹🇳', // チュニジア
  'DZ': '🇩🇿', // アルジェリア
  'SD': '🇸🇩', // スーダン
  'SS': '🇸🇸', // 南スーダン
  'ET': '🇪🇹', // エチオピア
  'ER': '🇪🇷', // エリトリア
  'DJ': '🇩🇯', // ジブチ
  'SO': '🇸🇴', // ソマリア
  'KE': '🇰🇪', // ケニア
  'UG': '🇺🇬', // ウガンダ
  'TZ': '🇹🇿', // タンザニア
  'RW': '🇷🇼', // ルワンダ
  'BI': '🇧🇮', // ブルンジ
  'CD': '🇨🇩', // コンゴ民主共和国
  'CG': '🇨🇬', // コンゴ共和国
  'CF': '🇨🇫', // 中央アフリカ共和国
  'TD': '🇹🇩', // チャド
  'CM': '🇨🇲', // カメルーン
  'NG': '🇳🇬', // ナイジェリア
  'NE': '🇳🇪', // ニジェール
  'ML': '🇲🇱', // マリ
  'BF': '🇧🇫', // ブルキナファソ
  'GH': '🇬🇭', // ガーナ
  'TG': '🇹🇬', // トーゴ
  'BJ': '🇧🇯', // ベナン
  'CI': '🇨🇮', // コートジボワール
  'LR': '🇱🇷', // リベリア
  'SL': '🇸🇱', // シエラレオネ
  'GN': '🇬🇳', // ギニア
  'GW': '🇬🇼', // ギニアビサウ
  'SN': '🇸🇳', // セネガル
  'GM': '🇬🇲', // ガンビア
  'MR': '🇲🇷', // モーリタニア
  'CV': '🇨🇻', // カーボベルデ
  'ST': '🇸🇹', // サントメ・プリンシペ
  'GQ': '🇬🇶', // 赤道ギニア
  'GA': '🇬🇦', // ガボン
  'AO': '🇦🇴', // アンゴラ
  'ZM': '🇿🇲', // ザンビア
  'ZW': '🇿🇼', // ジンバブエ
  'BW': '🇧🇼', // ボツワナ
  'NA': '🇳🇦', // ナミビア
  'LS': '🇱🇸', // レソト
  'SZ': '🇸🇿', // スワジランド
  'MG': '🇲🇬', // マダガスカル
  'MU': '🇲🇺', // モーリシャス
  'SC': '🇸🇨', // セーシェル
  'KM': '🇰🇲', // コモロ
  'MW': '🇲🇼', // マラウイ
  'MZ': '🇲🇿', // モザンビーク
}

/**
 * 国コードから国旗絵文字を取得する（フォールバック付き）
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'unknown') {
    return '🏳️'
  }

  const code = countryCode.toUpperCase()
  
  // まずマッピングテーブルを確認
  if (COUNTRY_FLAG_MAP[code]) {
    return COUNTRY_FLAG_MAP[code]
  }
  
  // マッピングテーブルにない場合はUnicode Regional Indicator Symbolsで生成
  return getCountryFlagEmoji(countryCode)
}

/**
 * 包括的な国情報マッピング（国名、国旗、座標を含む）
 */
export const COMPREHENSIVE_COUNTRY_MAP: { [key: string]: CountryInfo } = {
  'JP': { countryCode: 'JP', countryName: 'Japan', countryNameJa: '日本', flag: '🇯🇵', coordinates: { lat: 35.6762, lng: 139.6503 } },
  'US': { countryCode: 'US', countryName: 'United States', countryNameJa: 'アメリカ合衆国', flag: '🇺🇸', coordinates: { lat: 39.8283, lng: -98.5795 } },
  'GB': { countryCode: 'GB', countryName: 'United Kingdom', countryNameJa: 'イギリス', flag: '🇬🇧', coordinates: { lat: 55.3781, lng: -3.4360 } },
  'DE': { countryCode: 'DE', countryName: 'Germany', countryNameJa: 'ドイツ', flag: '🇩🇪', coordinates: { lat: 51.1657, lng: 10.4515 } },
  'FR': { countryCode: 'FR', countryName: 'France', countryNameJa: 'フランス', flag: '🇫🇷', coordinates: { lat: 46.2276, lng: 2.2137 } },
  'IT': { countryCode: 'IT', countryName: 'Italy', countryNameJa: 'イタリア', flag: '🇮🇹', coordinates: { lat: 41.8719, lng: 12.5674 } },
  'ES': { countryCode: 'ES', countryName: 'Spain', countryNameJa: 'スペイン', flag: '🇪🇸', coordinates: { lat: 40.4637, lng: -3.7492 } },
  'CN': { countryCode: 'CN', countryName: 'China', countryNameJa: '中国', flag: '🇨🇳', coordinates: { lat: 35.8617, lng: 104.1954 } },
  'KR': { countryCode: 'KR', countryName: 'South Korea', countryNameJa: '韓国', flag: '🇰🇷', coordinates: { lat: 35.9078, lng: 127.7669 } },
  'TH': { countryCode: 'TH', countryName: 'Thailand', countryNameJa: 'タイ', flag: '🇹🇭', coordinates: { lat: 15.8700, lng: 100.9925 } },
  'SG': { countryCode: 'SG', countryName: 'Singapore', countryNameJa: 'シンガポール', flag: '🇸🇬', coordinates: { lat: 1.3521, lng: 103.8198 } },
  'MY': { countryCode: 'MY', countryName: 'Malaysia', countryNameJa: 'マレーシア', flag: '🇲🇾', coordinates: { lat: 4.2105, lng: 101.9758 } },
  'ID': { countryCode: 'ID', countryName: 'Indonesia', countryNameJa: 'インドネシア', flag: '🇮🇩', coordinates: { lat: -0.7893, lng: 113.9213 } },
  'PH': { countryCode: 'PH', countryName: 'Philippines', countryNameJa: 'フィリピン', flag: '🇵🇭', coordinates: { lat: 12.8797, lng: 121.7740 } },
  'VN': { countryCode: 'VN', countryName: 'Vietnam', countryNameJa: 'ベトナム', flag: '🇻🇳', coordinates: { lat: 14.0583, lng: 108.2772 } },
  'IN': { countryCode: 'IN', countryName: 'India', countryNameJa: 'インド', flag: '🇮🇳', coordinates: { lat: 20.5937, lng: 78.9629 } },
  'AU': { countryCode: 'AU', countryName: 'Australia', countryNameJa: 'オーストラリア', flag: '🇦🇺', coordinates: { lat: -25.2744, lng: 133.7751 } },
  'NZ': { countryCode: 'NZ', countryName: 'New Zealand', countryNameJa: 'ニュージーランド', flag: '🇳🇿', coordinates: { lat: -40.9006, lng: 174.8860 } },
  'CA': { countryCode: 'CA', countryName: 'Canada', countryNameJa: 'カナダ', flag: '🇨🇦', coordinates: { lat: 56.1304, lng: -106.3468 } },
  'BR': { countryCode: 'BR', countryName: 'Brazil', countryNameJa: 'ブラジル', flag: '🇧🇷', coordinates: { lat: -14.2350, lng: -51.9253 } },
  'MX': { countryCode: 'MX', countryName: 'Mexico', countryNameJa: 'メキシコ', flag: '🇲🇽', coordinates: { lat: 23.6345, lng: -102.5528 } },
  'AR': { countryCode: 'AR', countryName: 'Argentina', countryNameJa: 'アルゼンチン', flag: '🇦🇷', coordinates: { lat: -38.4161, lng: -63.6167 } },
  'CL': { countryCode: 'CL', countryName: 'Chile', countryNameJa: 'チリ', flag: '🇨🇱', coordinates: { lat: -35.6751, lng: -71.5430 } },
  'PE': { countryCode: 'PE', countryName: 'Peru', countryNameJa: 'ペルー', flag: '🇵🇪', coordinates: { lat: -9.1900, lng: -75.0152 } },
  'ZA': { countryCode: 'ZA', countryName: 'South Africa', countryNameJa: '南アフリカ', flag: '🇿🇦', coordinates: { lat: -30.5595, lng: 22.9375 } },
  'EG': { countryCode: 'EG', countryName: 'Egypt', countryNameJa: 'エジプト', flag: '🇪🇬', coordinates: { lat: 26.0975, lng: 30.0444 } },
  'MA': { countryCode: 'MA', countryName: 'Morocco', countryNameJa: 'モロッコ', flag: '🇲🇦', coordinates: { lat: 31.6295, lng: -7.9811 } },
  'TR': { countryCode: 'TR', countryName: 'Turkey', countryNameJa: 'トルコ', flag: '🇹🇷', coordinates: { lat: 38.9637, lng: 35.2433 } },
  'RU': { countryCode: 'RU', countryName: 'Russia', countryNameJa: 'ロシア', flag: '🇷🇺', coordinates: { lat: 61.5240, lng: 105.3188 } },
  'PL': { countryCode: 'PL', countryName: 'Poland', countryNameJa: 'ポーランド', flag: '🇵🇱', coordinates: { lat: 51.9194, lng: 19.1451 } },
  'CZ': { countryCode: 'CZ', countryName: 'Czech Republic', countryNameJa: 'チェコ', flag: '🇨🇿', coordinates: { lat: 49.8175, lng: 15.4730 } },
  'HU': { countryCode: 'HU', countryName: 'Hungary', countryNameJa: 'ハンガリー', flag: '🇭🇺', coordinates: { lat: 47.1625, lng: 19.5033 } },
  'AT': { countryCode: 'AT', countryName: 'Austria', countryNameJa: 'オーストリア', flag: '🇦🇹', coordinates: { lat: 47.5162, lng: 14.5501 } },
  'CH': { countryCode: 'CH', countryName: 'Switzerland', countryNameJa: 'スイス', flag: '🇨🇭', coordinates: { lat: 46.8182, lng: 8.2275 } },
  'NL': { countryCode: 'NL', countryName: 'Netherlands', countryNameJa: 'オランダ', flag: '🇳🇱', coordinates: { lat: 52.1326, lng: 5.2913 } },
  'BE': { countryCode: 'BE', countryName: 'Belgium', countryNameJa: 'ベルギー', flag: '🇧🇪', coordinates: { lat: 50.5039, lng: 4.4699 } },
  'DK': { countryCode: 'DK', countryName: 'Denmark', countryNameJa: 'デンマーク', flag: '🇩🇰', coordinates: { lat: 56.2639, lng: 9.5018 } },
  'SE': { countryCode: 'SE', countryName: 'Sweden', countryNameJa: 'スウェーデン', flag: '🇸🇪', coordinates: { lat: 60.1282, lng: 18.6435 } },
  'NO': { countryCode: 'NO', countryName: 'Norway', countryNameJa: 'ノルウェー', flag: '🇳🇴', coordinates: { lat: 60.4720, lng: 8.4689 } },
  'FI': { countryCode: 'FI', countryName: 'Finland', countryNameJa: 'フィンランド', flag: '🇫🇮', coordinates: { lat: 61.9241, lng: 25.7482 } },
  'IS': { countryCode: 'IS', countryName: 'Iceland', countryNameJa: 'アイスランド', flag: '🇮🇸', coordinates: { lat: 64.9631, lng: -19.0208 } },
  'IE': { countryCode: 'IE', countryName: 'Ireland', countryNameJa: 'アイルランド', flag: '🇮🇪', coordinates: { lat: 53.4129, lng: -8.2439 } },
  'PT': { countryCode: 'PT', countryName: 'Portugal', countryNameJa: 'ポルトガル', flag: '🇵🇹', coordinates: { lat: 39.3999, lng: -8.2245 } },
  'GR': { countryCode: 'GR', countryName: 'Greece', countryNameJa: 'ギリシャ', flag: '🇬🇷', coordinates: { lat: 39.0742, lng: 21.8243 } },
  'HR': { countryCode: 'HR', countryName: 'Croatia', countryNameJa: 'クロアチア', flag: '🇭🇷', coordinates: { lat: 45.1000, lng: 15.2000 } },
  'SI': { countryCode: 'SI', countryName: 'Slovenia', countryNameJa: 'スロベニア', flag: '🇸🇮', coordinates: { lat: 46.1512, lng: 14.9955 } },
  'SK': { countryCode: 'SK', countryName: 'Slovakia', countryNameJa: 'スロバキア', flag: '🇸🇰', coordinates: { lat: 48.6690, lng: 19.6990 } },
  'EE': { countryCode: 'EE', countryName: 'Estonia', countryNameJa: 'エストニア', flag: '🇪🇪', coordinates: { lat: 58.5953, lng: 25.0136 } },
  'LV': { countryCode: 'LV', countryName: 'Latvia', countryNameJa: 'ラトビア', flag: '🇱🇻', coordinates: { lat: 56.8796, lng: 24.6032 } },
  'LT': { countryCode: 'LT', countryName: 'Lithuania', countryNameJa: 'リトアニア', flag: '🇱🇹', coordinates: { lat: 55.1694, lng: 23.8813 } },
  'UA': { countryCode: 'UA', countryName: 'Ukraine', countryNameJa: 'ウクライナ', flag: '🇺🇦', coordinates: { lat: 48.3794, lng: 31.1656 } },
  'RO': { countryCode: 'RO', countryName: 'Romania', countryNameJa: 'ルーマニア', flag: '🇷🇴', coordinates: { lat: 45.9432, lng: 24.9668 } },
  'BG': { countryCode: 'BG', countryName: 'Bulgaria', countryNameJa: 'ブルガリア', flag: '🇧🇬', coordinates: { lat: 42.7339, lng: 25.4858 } },
  'RS': { countryCode: 'RS', countryName: 'Serbia', countryNameJa: 'セルビア', flag: '🇷🇸', coordinates: { lat: 44.0165, lng: 21.0059 } },
  'ME': { countryCode: 'ME', countryName: 'Montenegro', countryNameJa: 'モンテネグロ', flag: '🇲🇪', coordinates: { lat: 42.7087, lng: 19.3744 } },
  'BA': { countryCode: 'BA', countryName: 'Bosnia and Herzegovina', countryNameJa: 'ボスニア・ヘルツェゴビナ', flag: '🇧🇦', coordinates: { lat: 43.9159, lng: 17.6791 } },
  'MK': { countryCode: 'MK', countryName: 'North Macedonia', countryNameJa: '北マケドニア', flag: '🇲🇰', coordinates: { lat: 41.6086, lng: 21.7453 } },
  'AL': { countryCode: 'AL', countryName: 'Albania', countryNameJa: 'アルバニア', flag: '🇦🇱', coordinates: { lat: 41.1533, lng: 20.1683 } },
  'XK': { countryCode: 'XK', countryName: 'Kosovo', countryNameJa: 'コソボ', flag: '🇽🇰', coordinates: { lat: 42.6026, lng: 20.9030 } },
  'MD': { countryCode: 'MD', countryName: 'Moldova', countryNameJa: 'モルドバ', flag: '🇲🇩', coordinates: { lat: 47.4116, lng: 28.3699 } },
  'BY': { countryCode: 'BY', countryName: 'Belarus', countryNameJa: 'ベラルーシ', flag: '🇧🇾', coordinates: { lat: 53.7098, lng: 27.9534 } },
  'GE': { countryCode: 'GE', countryName: 'Georgia', countryNameJa: 'ジョージア', flag: '🇬🇪', coordinates: { lat: 42.3154, lng: 43.3569 } },
  'AM': { countryCode: 'AM', countryName: 'Armenia', countryNameJa: 'アルメニア', flag: '🇦🇲', coordinates: { lat: 40.0691, lng: 45.0382 } },
  'AZ': { countryCode: 'AZ', countryName: 'Azerbaijan', countryNameJa: 'アゼルバイジャン', flag: '🇦🇿', coordinates: { lat: 40.1431, lng: 47.5769 } },
  'KZ': { countryCode: 'KZ', countryName: 'Kazakhstan', countryNameJa: 'カザフスタン', flag: '🇰🇿', coordinates: { lat: 48.0196, lng: 66.9237 } },
  'UZ': { countryCode: 'UZ', countryName: 'Uzbekistan', countryNameJa: 'ウズベキスタン', flag: '🇺🇿', coordinates: { lat: 41.3775, lng: 64.5853 } },
  'KG': { countryCode: 'KG', countryName: 'Kyrgyzstan', countryNameJa: 'キルギス', flag: '🇰🇬', coordinates: { lat: 41.2044, lng: 74.7661 } },
  'TJ': { countryCode: 'TJ', countryName: 'Tajikistan', countryNameJa: 'タジキスタン', flag: '🇹🇯', coordinates: { lat: 38.8610, lng: 71.2761 } },
  'TM': { countryCode: 'TM', countryName: 'Turkmenistan', countryNameJa: 'トルクメニスタン', flag: '🇹🇲', coordinates: { lat: 38.9697, lng: 59.5563 } },
  'AF': { countryCode: 'AF', countryName: 'Afghanistan', countryNameJa: 'アフガニスタン', flag: '🇦🇫', coordinates: { lat: 33.9391, lng: 67.7100 } },
  'PK': { countryCode: 'PK', countryName: 'Pakistan', countryNameJa: 'パキスタン', flag: '🇵🇰', coordinates: { lat: 30.3753, lng: 69.3451 } },
  'BD': { countryCode: 'BD', countryName: 'Bangladesh', countryNameJa: 'バングラデシュ', flag: '🇧🇩', coordinates: { lat: 23.6850, lng: 90.3563 } },
  'LK': { countryCode: 'LK', countryName: 'Sri Lanka', countryNameJa: 'スリランカ', flag: '🇱🇰', coordinates: { lat: 7.8731, lng: 80.7718 } },
  'NP': { countryCode: 'NP', countryName: 'Nepal', countryNameJa: 'ネパール', flag: '🇳🇵', coordinates: { lat: 28.3949, lng: 84.1240 } },
  'BT': { countryCode: 'BT', countryName: 'Bhutan', countryNameJa: 'ブータン', flag: '🇧🇹', coordinates: { lat: 27.5142, lng: 90.4336 } },
  'MV': { countryCode: 'MV', countryName: 'Maldives', countryNameJa: 'モルディブ', flag: '🇲🇻', coordinates: { lat: 3.2028, lng: 73.2207 } },
  'MM': { countryCode: 'MM', countryName: 'Myanmar', countryNameJa: 'ミャンマー', flag: '🇲🇲', coordinates: { lat: 21.9162, lng: 95.9560 } },
  'LA': { countryCode: 'LA', countryName: 'Laos', countryNameJa: 'ラオス', flag: '🇱🇦', coordinates: { lat: 19.8563, lng: 102.4955 } },
  'KH': { countryCode: 'KH', countryName: 'Cambodia', countryNameJa: 'カンボジア', flag: '🇰🇭', coordinates: { lat: 12.5657, lng: 104.9910 } },
  'BN': { countryCode: 'BN', countryName: 'Brunei', countryNameJa: 'ブルネイ', flag: '🇧🇳', coordinates: { lat: 4.5353, lng: 114.7277 } },
  'TL': { countryCode: 'TL', countryName: 'East Timor', countryNameJa: '東ティモール', flag: '🇹🇱', coordinates: { lat: -8.8742, lng: 125.7275 } },
  'MN': { countryCode: 'MN', countryName: 'Mongolia', countryNameJa: 'モンゴル', flag: '🇲🇳', coordinates: { lat: 46.8625, lng: 103.8467 } },
  'KP': { countryCode: 'KP', countryName: 'North Korea', countryNameJa: '北朝鮮', flag: '🇰🇵', coordinates: { lat: 40.3399, lng: 127.5101 } },
  'TW': { countryCode: 'TW', countryName: 'Taiwan', countryNameJa: '台湾', flag: '🇹🇼', coordinates: { lat: 23.6978, lng: 120.9605 } },
  'HK': { countryCode: 'HK', countryName: 'Hong Kong', countryNameJa: '香港', flag: '🇭🇰', coordinates: { lat: 22.3193, lng: 114.1694 } },
  'MO': { countryCode: 'MO', countryName: 'Macau', countryNameJa: 'マカオ', flag: '🇲🇴', coordinates: { lat: 22.1987, lng: 113.5439 } },
  'IL': { countryCode: 'IL', countryName: 'Israel', countryNameJa: 'イスラエル', flag: '🇮🇱', coordinates: { lat: 31.0461, lng: 34.8516 } },
  'PS': { countryCode: 'PS', countryName: 'Palestine', countryNameJa: 'パレスチナ', flag: '🇵🇸', coordinates: { lat: 31.9522, lng: 35.2332 } },
  'JO': { countryCode: 'JO', countryName: 'Jordan', countryNameJa: 'ヨルダン', flag: '🇯🇴', coordinates: { lat: 30.5852, lng: 36.2384 } },
  'LB': { countryCode: 'LB', countryName: 'Lebanon', countryNameJa: 'レバノン', flag: '🇱🇧', coordinates: { lat: 33.8547, lng: 35.8623 } },
  'SY': { countryCode: 'SY', countryName: 'Syria', countryNameJa: 'シリア', flag: '🇸🇾', coordinates: { lat: 34.8021, lng: 38.9968 } },
  'IQ': { countryCode: 'IQ', countryName: 'Iraq', countryNameJa: 'イラク', flag: '🇮🇶', coordinates: { lat: 33.2232, lng: 43.6793 } },
  'IR': { countryCode: 'IR', countryName: 'Iran', countryNameJa: 'イラン', flag: '🇮🇷', coordinates: { lat: 32.4279, lng: 53.6880 } },
  'SA': { countryCode: 'SA', countryName: 'Saudi Arabia', countryNameJa: 'サウジアラビア', flag: '🇸🇦', coordinates: { lat: 23.8859, lng: 45.0792 } },
  'AE': { countryCode: 'AE', countryName: 'United Arab Emirates', countryNameJa: 'アラブ首長国連邦', flag: '🇦🇪', coordinates: { lat: 23.4241, lng: 53.8478 } },
  'QA': { countryCode: 'QA', countryName: 'Qatar', countryNameJa: 'カタール', flag: '🇶🇦', coordinates: { lat: 25.3548, lng: 51.1839 } },
  'KW': { countryCode: 'KW', countryName: 'Kuwait', countryNameJa: 'クウェート', flag: '🇰🇼', coordinates: { lat: 29.3117, lng: 47.4818 } },
  'BH': { countryCode: 'BH', countryName: 'Bahrain', countryNameJa: 'バーレーン', flag: '🇧🇭', coordinates: { lat: 25.9304, lng: 50.6378 } },
  'OM': { countryCode: 'OM', countryName: 'Oman', countryNameJa: 'オマーン', flag: '🇴🇲', coordinates: { lat: 21.4735, lng: 55.9754 } },
  'YE': { countryCode: 'YE', countryName: 'Yemen', countryNameJa: 'イエメン', flag: '🇾🇪', coordinates: { lat: 15.5527, lng: 48.5164 } },
  'CY': { countryCode: 'CY', countryName: 'Cyprus', countryNameJa: 'キプロス', flag: '🇨🇾', coordinates: { lat: 35.1264, lng: 33.4299 } },
  'LY': { countryCode: 'LY', countryName: 'Libya', countryNameJa: 'リビア', flag: '🇱🇾', coordinates: { lat: 26.3351, lng: 17.2283 } },
  'TN': { countryCode: 'TN', countryName: 'Tunisia', countryNameJa: 'チュニジア', flag: '🇹🇳', coordinates: { lat: 33.8869, lng: 9.5375 } },
  'DZ': { countryCode: 'DZ', countryName: 'Algeria', countryNameJa: 'アルジェリア', flag: '🇩🇿', coordinates: { lat: 28.0339, lng: 1.6596 } },
  'SD': { countryCode: 'SD', countryName: 'Sudan', countryNameJa: 'スーダン', flag: '🇸🇩', coordinates: { lat: 12.8628, lng: 30.2176 } },
  'SS': { countryCode: 'SS', countryName: 'South Sudan', countryNameJa: '南スーダン', flag: '🇸🇸', coordinates: { lat: 12.8628, lng: 30.2176 } },
  'ET': { countryCode: 'ET', countryName: 'Ethiopia', countryNameJa: 'エチオピア', flag: '🇪🇹', coordinates: { lat: 9.1450, lng: 40.4897 } },
  'ER': { countryCode: 'ER', countryName: 'Eritrea', countryNameJa: 'エリトリア', flag: '🇪🇷', coordinates: { lat: 15.1794, lng: 39.7823 } },
  'DJ': { countryCode: 'DJ', countryName: 'Djibouti', countryNameJa: 'ジブチ', flag: '🇩🇯', coordinates: { lat: 11.8251, lng: 42.5903 } },
  'SO': { countryCode: 'SO', countryName: 'Somalia', countryNameJa: 'ソマリア', flag: '🇸🇴', coordinates: { lat: 5.1521, lng: 46.1996 } },
  'KE': { countryCode: 'KE', countryName: 'Kenya', countryNameJa: 'ケニア', flag: '🇰🇪', coordinates: { lat: -0.0236, lng: 37.9062 } },
  'UG': { countryCode: 'UG', countryName: 'Uganda', countryNameJa: 'ウガンダ', flag: '🇺🇬', coordinates: { lat: 1.3733, lng: 32.2903 } },
  'TZ': { countryCode: 'TZ', countryName: 'Tanzania', countryNameJa: 'タンザニア', flag: '🇹🇿', coordinates: { lat: -6.3690, lng: 34.8888 } },
  'RW': { countryCode: 'RW', countryName: 'Rwanda', countryNameJa: 'ルワンダ', flag: '🇷🇼', coordinates: { lat: -1.9403, lng: 29.8739 } },
  'BI': { countryCode: 'BI', countryName: 'Burundi', countryNameJa: 'ブルンジ', flag: '🇧🇮', coordinates: { lat: -3.3731, lng: 29.9189 } },
  'CD': { countryCode: 'CD', countryName: 'Democratic Republic of the Congo', countryNameJa: 'コンゴ民主共和国', flag: '🇨🇩', coordinates: { lat: -4.0383, lng: 21.7587 } },
  'CG': { countryCode: 'CG', countryName: 'Republic of the Congo', countryNameJa: 'コンゴ共和国', flag: '🇨🇬', coordinates: { lat: -0.2280, lng: 15.8277 } },
  'CF': { countryCode: 'CF', countryName: 'Central African Republic', countryNameJa: '中央アフリカ共和国', flag: '🇨🇫', coordinates: { lat: 6.6111, lng: 20.9394 } },
  'TD': { countryCode: 'TD', countryName: 'Chad', countryNameJa: 'チャド', flag: '🇹🇩', coordinates: { lat: 15.4542, lng: 18.7322 } },
  'CM': { countryCode: 'CM', countryName: 'Cameroon', countryNameJa: 'カメルーン', flag: '🇨🇲', coordinates: { lat: 7.3697, lng: 12.3547 } },
  'NG': { countryCode: 'NG', countryName: 'Nigeria', countryNameJa: 'ナイジェリア', flag: '🇳🇬', coordinates: { lat: 9.0820, lng: 8.6753 } },
  'NE': { countryCode: 'NE', countryName: 'Niger', countryNameJa: 'ニジェール', flag: '🇳🇪', coordinates: { lat: 17.6078, lng: 8.0817 } },
  'ML': { countryCode: 'ML', countryName: 'Mali', countryNameJa: 'マリ', flag: '🇲🇱', coordinates: { lat: 17.5707, lng: -3.9962 } },
  'BF': { countryCode: 'BF', countryName: 'Burkina Faso', countryNameJa: 'ブルキナファソ', flag: '🇧🇫', coordinates: { lat: 12.2383, lng: -1.5616 } },
  'GH': { countryCode: 'GH', countryName: 'Ghana', countryNameJa: 'ガーナ', flag: '🇬🇭', coordinates: { lat: 7.9465, lng: -1.0232 } },
  'TG': { countryCode: 'TG', countryName: 'Togo', countryNameJa: 'トーゴ', flag: '🇹🇬', coordinates: { lat: 8.6195, lng: 0.8248 } },
  'BJ': { countryCode: 'BJ', countryName: 'Benin', countryNameJa: 'ベナン', flag: '🇧🇯', coordinates: { lat: 9.3077, lng: 2.3158 } },
  'CI': { countryCode: 'CI', countryName: 'Côte d\'Ivoire', countryNameJa: 'コートジボワール', flag: '🇨🇮', coordinates: { lat: 7.5400, lng: -5.5471 } },
  'LR': { countryCode: 'LR', countryName: 'Liberia', countryNameJa: 'リベリア', flag: '🇱🇷', coordinates: { lat: 6.4281, lng: -9.4295 } },
  'SL': { countryCode: 'SL', countryName: 'Sierra Leone', countryNameJa: 'シエラレオネ', flag: '🇸🇱', coordinates: { lat: 8.4606, lng: -11.7799 } },
  'GN': { countryCode: 'GN', countryName: 'Guinea', countryNameJa: 'ギニア', flag: '🇬🇳', coordinates: { lat: 9.6412, lng: -9.6886 } },
  'GW': { countryCode: 'GW', countryName: 'Guinea-Bissau', countryNameJa: 'ギニアビサウ', flag: '🇬🇼', coordinates: { lat: 11.8037, lng: -15.1804 } },
  'SN': { countryCode: 'SN', countryName: 'Senegal', countryNameJa: 'セネガル', flag: '🇸🇳', coordinates: { lat: 14.4974, lng: -14.4524 } },
  'GM': { countryCode: 'GM', countryName: 'Gambia', countryNameJa: 'ガンビア', flag: '🇬🇲', coordinates: { lat: 13.4432, lng: -15.3101 } },
  'MR': { countryCode: 'MR', countryName: 'Mauritania', countryNameJa: 'モーリタニア', flag: '🇲🇷', coordinates: { lat: 21.0079, lng: -10.9408 } },
  'CV': { countryCode: 'CV', countryName: 'Cape Verde', countryNameJa: 'カーボベルデ', flag: '🇨🇻', coordinates: { lat: 16.5388, lng: -24.0132 } },
  'ST': { countryCode: 'ST', countryName: 'São Tomé and Príncipe', countryNameJa: 'サントメ・プリンシペ', flag: '🇸🇹', coordinates: { lat: 0.1864, lng: 6.6131 } },
  'GQ': { countryCode: 'GQ', countryName: 'Equatorial Guinea', countryNameJa: '赤道ギニア', flag: '🇬🇶', coordinates: { lat: 1.6508, lng: 10.2679 } },
  'GA': { countryCode: 'GA', countryName: 'Gabon', countryNameJa: 'ガボン', flag: '🇬🇦', coordinates: { lat: -0.8037, lng: 11.6094 } },
  'AO': { countryCode: 'AO', countryName: 'Angola', countryNameJa: 'アンゴラ', flag: '🇦🇴', coordinates: { lat: -11.2027, lng: 17.8739 } },
  'ZM': { countryCode: 'ZM', countryName: 'Zambia', countryNameJa: 'ザンビア', flag: '🇿🇲', coordinates: { lat: -13.1339, lng: 27.8493 } },
  'ZW': { countryCode: 'ZW', countryName: 'Zimbabwe', countryNameJa: 'ジンバブエ', flag: '🇿🇼', coordinates: { lat: -19.0154, lng: 29.1549 } },
  'BW': { countryCode: 'BW', countryName: 'Botswana', countryNameJa: 'ボツワナ', flag: '🇧🇼', coordinates: { lat: -22.3285, lng: 24.6849 } },
  'NA': { countryCode: 'NA', countryName: 'Namibia', countryNameJa: 'ナミビア', flag: '🇳🇦', coordinates: { lat: -22.9576, lng: 18.4904 } },
  'LS': { countryCode: 'LS', countryName: 'Lesotho', countryNameJa: 'レソト', flag: '🇱🇸', coordinates: { lat: -29.6100, lng: 28.2336 } },
  'SZ': { countryCode: 'SZ', countryName: 'Swaziland', countryNameJa: 'スワジランド', flag: '🇸🇿', coordinates: { lat: -26.5225, lng: 31.4659 } },
  'MG': { countryCode: 'MG', countryName: 'Madagascar', countryNameJa: 'マダガスカル', flag: '🇲🇬', coordinates: { lat: -18.7669, lng: 46.8691 } },
  'MU': { countryCode: 'MU', countryName: 'Mauritius', countryNameJa: 'モーリシャス', flag: '🇲🇺', coordinates: { lat: -20.3484, lng: 57.5522 } },
  'SC': { countryCode: 'SC', countryName: 'Seychelles', countryNameJa: 'セーシェル', flag: '🇸🇨', coordinates: { lat: -4.6796, lng: 55.4920 } },
  'KM': { countryCode: 'KM', countryName: 'Comoros', countryNameJa: 'コモロ', flag: '🇰🇲', coordinates: { lat: -11.8750, lng: 43.8722 } },
  'MW': { countryCode: 'MW', countryName: 'Malawi', countryNameJa: 'マラウイ', flag: '🇲🇼', coordinates: { lat: -13.2543, lng: 34.3015 } },
  'MZ': { countryCode: 'MZ', countryName: 'Mozambique', countryNameJa: 'モザンビーク', flag: '🇲🇿', coordinates: { lat: -18.6657, lng: 35.5296 } },
}

/**
 * 国名から国旗絵文字を取得する
 */
export function getCountryFlagByName(countryName: string): string {
  // 国名から国コードを推測する簡単なマッピング
  const nameToCodeMap: { [key: string]: string } = {
    'Japan': 'JP',
    'United States': 'US',
    'United Kingdom': 'GB',
    'Germany': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'China': 'CN',
    'South Korea': 'KR',
    'Thailand': 'TH',
    'Singapore': 'SG',
    'Malaysia': 'MY',
    'Indonesia': 'ID',
    'Philippines': 'PH',
    'Vietnam': 'VN',
    'India': 'IN',
    'Australia': 'AU',
    'New Zealand': 'NZ',
    'Canada': 'CA',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Peru': 'PE',
    'South Africa': 'ZA',
    'Egypt': 'EG',
    'Morocco': 'MA',
    'Turkey': 'TR',
    'Russia': 'RU',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Austria': 'AT',
    'Switzerland': 'CH',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Denmark': 'DK',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Finland': 'FI',
    'Iceland': 'IS',
    'Ireland': 'IE',
    'Portugal': 'PT',
    'Greece': 'GR',
    'Croatia': 'HR',
    'Slovenia': 'SI',
    'Slovakia': 'SK',
    'Estonia': 'EE',
    'Latvia': 'LV',
    'Lithuania': 'LT',
    'Ukraine': 'UA',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Serbia': 'RS',
    'Montenegro': 'ME',
    'Bosnia and Herzegovina': 'BA',
    'North Macedonia': 'MK',
    'Albania': 'AL',
    'Kosovo': 'XK',
    'Moldova': 'MD',
    'Belarus': 'BY',
    'Georgia': 'GE',
    'Armenia': 'AM',
    'Azerbaijan': 'AZ',
    'Kazakhstan': 'KZ',
    'Uzbekistan': 'UZ',
    'Kyrgyzstan': 'KG',
    'Tajikistan': 'TJ',
    'Turkmenistan': 'TM',
    'Afghanistan': 'AF',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
    'Sri Lanka': 'LK',
    'Nepal': 'NP',
    'Bhutan': 'BT',
    'Maldives': 'MV',
    'Myanmar': 'MM',
    'Laos': 'LA',
    'Cambodia': 'KH',
    'Brunei': 'BN',
    'East Timor': 'TL',
    'Mongolia': 'MN',
    'North Korea': 'KP',
    'Taiwan': 'TW',
    'Hong Kong': 'HK',
    'Macau': 'MO',
    'Israel': 'IL',
    'Palestine': 'PS',
    'Jordan': 'JO',
    'Lebanon': 'LB',
    'Syria': 'SY',
    'Iraq': 'IQ',
    'Iran': 'IR',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'Qatar': 'QA',
    'Kuwait': 'KW',
    'Bahrain': 'BH',
    'Oman': 'OM',
    'Yemen': 'YE',
    'Cyprus': 'CY',
    'Libya': 'LY',
    'Tunisia': 'TN',
    'Algeria': 'DZ',
    'Sudan': 'SD',
    'South Sudan': 'SS',
    'Ethiopia': 'ET',
    'Eritrea': 'ER',
    'Djibouti': 'DJ',
    'Somalia': 'SO',
    'Kenya': 'KE',
    'Uganda': 'UG',
    'Tanzania': 'TZ',
    'Rwanda': 'RW',
    'Burundi': 'BI',
    'Democratic Republic of the Congo': 'CD',
    'Republic of the Congo': 'CG',
    'Central African Republic': 'CF',
    'Chad': 'TD',
    'Cameroon': 'CM',
    'Nigeria': 'NG',
    'Niger': 'NE',
    'Mali': 'ML',
    'Burkina Faso': 'BF',
    'Ghana': 'GH',
    'Togo': 'TG',
    'Benin': 'BJ',
    'Côte d\'Ivoire': 'CI',
    'Liberia': 'LR',
    'Sierra Leone': 'SL',
    'Guinea': 'GN',
    'Guinea-Bissau': 'GW',
    'Senegal': 'SN',
    'Gambia': 'GM',
    'Mauritania': 'MR',
    'Cape Verde': 'CV',
    'São Tomé and Príncipe': 'ST',
    'Equatorial Guinea': 'GQ',
    'Gabon': 'GA',
    'Angola': 'AO',
    'Zambia': 'ZM',
    'Zimbabwe': 'ZW',
    'Botswana': 'BW',
    'Namibia': 'NA',
    'Lesotho': 'LS',
    'Swaziland': 'SZ',
    'Madagascar': 'MG',
    'Mauritius': 'MU',
    'Seychelles': 'SC',
    'Comoros': 'KM',
    'Malawi': 'MW',
    'Mozambique': 'MZ',
  }

  const countryCode = nameToCodeMap[countryName]
  if (countryCode) {
    return getCountryFlag(countryCode)
  }

  return '🏳️'
}

/**
 * 国コードから包括的な国情報を取得する
 */
export function getCountryInfo(countryCode: string): CountryInfo | null {
  if (!countryCode || countryCode === 'unknown') {
    return null
  }

  const code = countryCode.toUpperCase()
  return COMPREHENSIVE_COUNTRY_MAP[code] || null
}

/**
 * 国名から包括的な国情報を取得する
 */
export function getCountryInfoByName(countryName: string): CountryInfo | null {
  // 国名から国コードを検索
  for (const [code, info] of Object.entries(COMPREHENSIVE_COUNTRY_MAP)) {
    if (info.countryName === countryName || info.countryNameJa === countryName) {
      return info
    }
  }
  return null
}

/**
 * 国コードから日本語名を取得する（包括的マップ使用）
 */
export function getCountryNameJaByCode(countryCode: string): string {
  const info = getCountryInfo(countryCode)
  return info?.countryNameJa || countryCode
}

/**
 * 国名を日本語に変換する（包括的マップ使用）
 */
export function getCountryNameJa(countryName: string): string {
  const info = getCountryInfoByName(countryName)
  return info?.countryNameJa || countryName
}

/**
 * 国コードから座標を取得する
 */
export function getCountryCoordinates(countryCode: string): { lat: number; lng: number } | null {
  const info = getCountryInfo(countryCode)
  return info?.coordinates || null
}
