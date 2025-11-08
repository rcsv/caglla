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
  
  // アジア（追加）
  BD: { code: 'BD', name: 'Bangladesh', nameJa: 'バングラデシュ', currency: 'BDT', timezones: ['Asia/Dhaka'], defaultTimezone: 'Asia/Dhaka' },
  BT: { code: 'BT', name: 'Bhutan', nameJa: 'ブータン', currency: 'BTN', timezones: ['Asia/Thimphu'], defaultTimezone: 'Asia/Thimphu' },
  BN: { code: 'BN', name: 'Brunei', nameJa: 'ブルネイ', currency: 'BND', timezones: ['Asia/Brunei'], defaultTimezone: 'Asia/Brunei' },
  KH: { code: 'KH', name: 'Cambodia', nameJa: 'カンボジア', currency: 'KHR', timezones: ['Asia/Phnom_Penh'], defaultTimezone: 'Asia/Phnom_Penh' },
  LK: { code: 'LK', name: 'Sri Lanka', nameJa: 'スリランカ', currency: 'LKR', timezones: ['Asia/Colombo'], defaultTimezone: 'Asia/Colombo' },
  MM: { code: 'MM', name: 'Myanmar', nameJa: 'ミャンマー', currency: 'MMK', timezones: ['Asia/Yangon'], defaultTimezone: 'Asia/Yangon' },
  NP: { code: 'NP', name: 'Nepal', nameJa: 'ネパール', currency: 'NPR', timezones: ['Asia/Kathmandu'], defaultTimezone: 'Asia/Kathmandu' },
  PK: { code: 'PK', name: 'Pakistan', nameJa: 'パキスタン', currency: 'PKR', timezones: ['Asia/Karachi'], defaultTimezone: 'Asia/Karachi' },
  AF: { code: 'AF', name: 'Afghanistan', nameJa: 'アフガニスタン', currency: 'AFN', timezones: ['Asia/Kabul'], defaultTimezone: 'Asia/Kabul' },
  IR: { code: 'IR', name: 'Iran', nameJa: 'イラン', currency: 'IRR', timezones: ['Asia/Tehran'], defaultTimezone: 'Asia/Tehran' },
  IQ: { code: 'IQ', name: 'Iraq', nameJa: 'イラク', currency: 'IQD', timezones: ['Asia/Baghdad'], defaultTimezone: 'Asia/Baghdad' },
  JO: { code: 'JO', name: 'Jordan', nameJa: 'ヨルダン', currency: 'JOD', timezones: ['Asia/Amman'], defaultTimezone: 'Asia/Amman' },
  KW: { code: 'KW', name: 'Kuwait', nameJa: 'クウェート', currency: 'KWD', timezones: ['Asia/Kuwait'], defaultTimezone: 'Asia/Kuwait' },
  LB: { code: 'LB', name: 'Lebanon', nameJa: 'レバノン', currency: 'LBP', timezones: ['Asia/Beirut'], defaultTimezone: 'Asia/Beirut' },
  OM: { code: 'OM', name: 'Oman', nameJa: 'オマーン', currency: 'OMR', timezones: ['Asia/Muscat'], defaultTimezone: 'Asia/Muscat' },
  QA: { code: 'QA', name: 'Qatar', nameJa: 'カタール', currency: 'QAR', timezones: ['Asia/Qatar'], defaultTimezone: 'Asia/Qatar' },
  YE: { code: 'YE', name: 'Yemen', nameJa: 'イエメン', currency: 'YER', timezones: ['Asia/Aden'], defaultTimezone: 'Asia/Aden' },
  KZ: { code: 'KZ', name: 'Kazakhstan', nameJa: 'カザフスタン', currency: 'KZT', timezones: ['Asia/Almaty', 'Asia/Aqtau'], defaultTimezone: 'Asia/Almaty' },
  UZ: { code: 'UZ', name: 'Uzbekistan', nameJa: 'ウズベキスタン', currency: 'UZS', timezones: ['Asia/Tashkent'], defaultTimezone: 'Asia/Tashkent' },
  GE: { code: 'GE', name: 'Georgia', nameJa: 'ジョージア', currency: 'GEL', timezones: ['Asia/Tbilisi'], defaultTimezone: 'Asia/Tbilisi' },
  AM: { code: 'AM', name: 'Armenia', nameJa: 'アルメニア', currency: 'AMD', timezones: ['Asia/Yerevan'], defaultTimezone: 'Asia/Yerevan' },
  AZ: { code: 'AZ', name: 'Azerbaijan', nameJa: 'アゼルバイジャン', currency: 'AZN', timezones: ['Asia/Baku'], defaultTimezone: 'Asia/Baku' },
  MN: { code: 'MN', name: 'Mongolia', nameJa: 'モンゴル', currency: 'MNT', timezones: ['Asia/Ulaanbaatar'], defaultTimezone: 'Asia/Ulaanbaatar' },
  
  // ヨーロッパ（追加）
  IE: { code: 'IE', name: 'Ireland', nameJa: 'アイルランド', currency: 'EUR', timezones: ['Europe/Dublin'], defaultTimezone: 'Europe/Dublin' },
  PT: { code: 'PT', name: 'Portugal', nameJa: 'ポルトガル', currency: 'EUR', timezones: ['Europe/Lisbon'], defaultTimezone: 'Europe/Lisbon' },
  GR: { code: 'GR', name: 'Greece', nameJa: 'ギリシャ', currency: 'EUR', timezones: ['Europe/Athens'], defaultTimezone: 'Europe/Athens' },
  RO: { code: 'RO', name: 'Romania', nameJa: 'ルーマニア', currency: 'RON', timezones: ['Europe/Bucharest'], defaultTimezone: 'Europe/Bucharest' },
  BG: { code: 'BG', name: 'Bulgaria', nameJa: 'ブルガリア', currency: 'BGN', timezones: ['Europe/Sofia'], defaultTimezone: 'Europe/Sofia' },
  HR: { code: 'HR', name: 'Croatia', nameJa: 'クロアチア', currency: 'EUR', timezones: ['Europe/Zagreb'], defaultTimezone: 'Europe/Zagreb' },
  SI: { code: 'SI', name: 'Slovenia', nameJa: 'スロベニア', currency: 'EUR', timezones: ['Europe/Ljubljana'], defaultTimezone: 'Europe/Ljubljana' },
  SK: { code: 'SK', name: 'Slovakia', nameJa: 'スロバキア', currency: 'EUR', timezones: ['Europe/Bratislava'], defaultTimezone: 'Europe/Bratislava' },
  EE: { code: 'EE', name: 'Estonia', nameJa: 'エストニア', currency: 'EUR', timezones: ['Europe/Tallinn'], defaultTimezone: 'Europe/Tallinn' },
  LV: { code: 'LV', name: 'Latvia', nameJa: 'ラトビア', currency: 'EUR', timezones: ['Europe/Riga'], defaultTimezone: 'Europe/Riga' },
  LT: { code: 'LT', name: 'Lithuania', nameJa: 'リトアニア', currency: 'EUR', timezones: ['Europe/Vilnius'], defaultTimezone: 'Europe/Vilnius' },
  IS: { code: 'IS', name: 'Iceland', nameJa: 'アイスランド', currency: 'ISK', timezones: ['Atlantic/Reykjavik'], defaultTimezone: 'Atlantic/Reykjavik' },
  MT: { code: 'MT', name: 'Malta', nameJa: 'マルタ', currency: 'EUR', timezones: ['Europe/Malta'], defaultTimezone: 'Europe/Malta' },
  CY: { code: 'CY', name: 'Cyprus', nameJa: 'キプロス', currency: 'EUR', timezones: ['Asia/Nicosia'], defaultTimezone: 'Asia/Nicosia' },
  LU: { code: 'LU', name: 'Luxembourg', nameJa: 'ルクセンブルク', currency: 'EUR', timezones: ['Europe/Luxembourg'], defaultTimezone: 'Europe/Luxembourg' },
  RS: { code: 'RS', name: 'Serbia', nameJa: 'セルビア', currency: 'RSD', timezones: ['Europe/Belgrade'], defaultTimezone: 'Europe/Belgrade' },
  BA: { code: 'BA', name: 'Bosnia and Herzegovina', nameJa: 'ボスニア・ヘルツェゴビナ', currency: 'BAM', timezones: ['Europe/Sarajevo'], defaultTimezone: 'Europe/Sarajevo' },
  ME: { code: 'ME', name: 'Montenegro', nameJa: 'モンテネグロ', currency: 'EUR', timezones: ['Europe/Podgorica'], defaultTimezone: 'Europe/Podgorica' },
  MK: { code: 'MK', name: 'North Macedonia', nameJa: '北マケドニア', currency: 'MKD', timezones: ['Europe/Skopje'], defaultTimezone: 'Europe/Skopje' },
  AL: { code: 'AL', name: 'Albania', nameJa: 'アルバニア', currency: 'ALL', timezones: ['Europe/Tirane'], defaultTimezone: 'Europe/Tirane' },
  UA: { code: 'UA', name: 'Ukraine', nameJa: 'ウクライナ', currency: 'UAH', timezones: ['Europe/Kyiv'], defaultTimezone: 'Europe/Kyiv' },
  BY: { code: 'BY', name: 'Belarus', nameJa: 'ベラルーシ', currency: 'BYN', timezones: ['Europe/Minsk'], defaultTimezone: 'Europe/Minsk' },
  MD: { code: 'MD', name: 'Moldova', nameJa: 'モルドバ', currency: 'MDL', timezones: ['Europe/Chisinau'], defaultTimezone: 'Europe/Chisinau' },
  
  // アフリカ（追加）
  EG: { code: 'EG', name: 'Egypt', nameJa: 'エジプト', currency: 'EGP', timezones: ['Africa/Cairo'], defaultTimezone: 'Africa/Cairo' },
  MA: { code: 'MA', name: 'Morocco', nameJa: 'モロッコ', currency: 'MAD', timezones: ['Africa/Casablanca'], defaultTimezone: 'Africa/Casablanca' },
  TN: { code: 'TN', name: 'Tunisia', nameJa: 'チュニジア', currency: 'TND', timezones: ['Africa/Tunis'], defaultTimezone: 'Africa/Tunis' },
  DZ: { code: 'DZ', name: 'Algeria', nameJa: 'アルジェリア', currency: 'DZD', timezones: ['Africa/Algiers'], defaultTimezone: 'Africa/Algiers' },
  KE: { code: 'KE', name: 'Kenya', nameJa: 'ケニア', currency: 'KES', timezones: ['Africa/Nairobi'], defaultTimezone: 'Africa/Nairobi' },
  TZ: { code: 'TZ', name: 'Tanzania', nameJa: 'タンザニア', currency: 'TZS', timezones: ['Africa/Dar_es_Salaam'], defaultTimezone: 'Africa/Dar_es_Salaam' },
  UG: { code: 'UG', name: 'Uganda', nameJa: 'ウガンダ', currency: 'UGX', timezones: ['Africa/Kampala'], defaultTimezone: 'Africa/Kampala' },
  ET: { code: 'ET', name: 'Ethiopia', nameJa: 'エチオピア', currency: 'ETB', timezones: ['Africa/Addis_Ababa'], defaultTimezone: 'Africa/Addis_Ababa' },
  GH: { code: 'GH', name: 'Ghana', nameJa: 'ガーナ', currency: 'GHS', timezones: ['Africa/Accra'], defaultTimezone: 'Africa/Accra' },
  NG: { code: 'NG', name: 'Nigeria', nameJa: 'ナイジェリア', currency: 'NGN', timezones: ['Africa/Lagos'], defaultTimezone: 'Africa/Lagos' },
  
  // 中南米（追加）
  CR: { code: 'CR', name: 'Costa Rica', nameJa: 'コスタリカ', currency: 'CRC', timezones: ['America/Costa_Rica'], defaultTimezone: 'America/Costa_Rica' },
  PA: { code: 'PA', name: 'Panama', nameJa: 'パナマ', currency: 'PAB', timezones: ['America/Panama'], defaultTimezone: 'America/Panama' },
  GT: { code: 'GT', name: 'Guatemala', nameJa: 'グアテマラ', currency: 'GTQ', timezones: ['America/Guatemala'], defaultTimezone: 'America/Guatemala' },
  HN: { code: 'HN', name: 'Honduras', nameJa: 'ホンジュラス', currency: 'HNL', timezones: ['America/Tegucigalpa'], defaultTimezone: 'America/Tegucigalpa' },
  SV: { code: 'SV', name: 'El Salvador', nameJa: 'エルサルバドル', currency: 'USD', timezones: ['America/El_Salvador'], defaultTimezone: 'America/El_Salvador' },
  NI: { code: 'NI', name: 'Nicaragua', nameJa: 'ニカラグア', currency: 'NIO', timezones: ['America/Managua'], defaultTimezone: 'America/Managua' },
  CU: { code: 'CU', name: 'Cuba', nameJa: 'キューバ', currency: 'CUP', timezones: ['America/Havana'], defaultTimezone: 'America/Havana' },
  DO: { code: 'DO', name: 'Dominican Republic', nameJa: 'ドミニカ共和国', currency: 'DOP', timezones: ['America/Santo_Domingo'], defaultTimezone: 'America/Santo_Domingo' },
  JM: { code: 'JM', name: 'Jamaica', nameJa: 'ジャマイカ', currency: 'JMD', timezones: ['America/Jamaica'], defaultTimezone: 'America/Jamaica' },
  TT: { code: 'TT', name: 'Trinidad and Tobago', nameJa: 'トリニダード・トバゴ', currency: 'TTD', timezones: ['America/Port_of_Spain'], defaultTimezone: 'America/Port_of_Spain' },
  UY: { code: 'UY', name: 'Uruguay', nameJa: 'ウルグアイ', currency: 'UYU', timezones: ['America/Montevideo'], defaultTimezone: 'America/Montevideo' },
  PY: { code: 'PY', name: 'Paraguay', nameJa: 'パラグアイ', currency: 'PYG', timezones: ['America/Asuncion'], defaultTimezone: 'America/Asuncion' },
  BO: { code: 'BO', name: 'Bolivia', nameJa: 'ボリビア', currency: 'BOB', timezones: ['America/La_Paz'], defaultTimezone: 'America/La_Paz' },
  EC: { code: 'EC', name: 'Ecuador', nameJa: 'エクアドル', currency: 'USD', timezones: ['America/Guayaquil'], defaultTimezone: 'America/Guayaquil' },
  VE: { code: 'VE', name: 'Venezuela', nameJa: 'ベネズエラ', currency: 'VES', timezones: ['America/Caracas'], defaultTimezone: 'America/Caracas' },
  GY: { code: 'GY', name: 'Guyana', nameJa: 'ガイアナ', currency: 'GYD', timezones: ['America/Guyana'], defaultTimezone: 'America/Guyana' },
  SR: { code: 'SR', name: 'Suriname', nameJa: 'スリナム', currency: 'SRD', timezones: ['America/Paramaribo'], defaultTimezone: 'America/Paramaribo' },
  
  // オセアニア（追加）
  FJ: { code: 'FJ', name: 'Fiji', nameJa: 'フィジー', currency: 'FJD', timezones: ['Pacific/Fiji'], defaultTimezone: 'Pacific/Fiji' },
  PG: { code: 'PG', name: 'Papua New Guinea', nameJa: 'パプアニューギニア', currency: 'PGK', timezones: ['Pacific/Port_Moresby'], defaultTimezone: 'Pacific/Port_Moresby' },
  NC: { code: 'NC', name: 'New Caledonia', nameJa: 'ニューカレドニア', currency: 'XPF', timezones: ['Pacific/Noumea'], defaultTimezone: 'Pacific/Noumea' },
  PF: { code: 'PF', name: 'French Polynesia', nameJa: 'フランス領ポリネシア', currency: 'XPF', timezones: ['Pacific/Tahiti'], defaultTimezone: 'Pacific/Tahiti' },
  
  // 海外領土・特殊地域（EUR/USD圏）
  GP: { code: 'GP', name: 'Guadeloupe', nameJa: 'グアドループ', currency: 'EUR', timezones: ['America/Guadeloupe'], defaultTimezone: 'America/Guadeloupe' },
  RE: { code: 'RE', name: 'Réunion', nameJa: 'レユニオン', currency: 'EUR', timezones: ['Indian/Reunion'], defaultTimezone: 'Indian/Reunion' },
  PM: { code: 'PM', name: 'Saint Pierre and Miquelon', nameJa: 'サンピエール・ミクロン', currency: 'EUR', timezones: ['America/Miquelon'], defaultTimezone: 'America/Miquelon' },
  GF: { code: 'GF', name: 'French Guiana', nameJa: 'フランス領ギアナ', currency: 'EUR', timezones: ['America/Cayenne'], defaultTimezone: 'America/Cayenne' },
  MQ: { code: 'MQ', name: 'Martinique', nameJa: 'マルティニーク', currency: 'EUR', timezones: ['America/Martinique'], defaultTimezone: 'America/Martinique' },
  YT: { code: 'YT', name: 'Mayotte', nameJa: 'マヨット', currency: 'EUR', timezones: ['Indian/Mayotte'], defaultTimezone: 'Indian/Mayotte' },
  BL: { code: 'BL', name: 'Saint Barthélemy', nameJa: 'サン・バルテルミー', currency: 'EUR', timezones: ['America/St_Barthelemy'], defaultTimezone: 'America/St_Barthelemy' },
  MF: { code: 'MF', name: 'Saint Martin', nameJa: 'サン・マルタン', currency: 'EUR', timezones: ['America/Marigot'], defaultTimezone: 'America/Marigot' },
  VI: { code: 'VI', name: 'U.S. Virgin Islands', nameJa: '米領ヴァージン諸島', currency: 'USD', timezones: ['America/St_Thomas'], defaultTimezone: 'America/St_Thomas' },
  PR: { code: 'PR', name: 'Puerto Rico', nameJa: 'プエルトリコ', currency: 'USD', timezones: ['America/Puerto_Rico'], defaultTimezone: 'America/Puerto_Rico' },
  AS: { code: 'AS', name: 'American Samoa', nameJa: '米領サモア', currency: 'USD', timezones: ['Pacific/Pago_Pago'], defaultTimezone: 'Pacific/Pago_Pago' },
  KY: { code: 'KY', name: 'Cayman Islands', nameJa: 'ケイマン諸島', currency: 'KYD', timezones: ['America/Cayman'], defaultTimezone: 'America/Cayman' },
  BM: { code: 'BM', name: 'Bermuda', nameJa: 'バミューダ', currency: 'BMD', timezones: ['Atlantic/Bermuda'], defaultTimezone: 'Atlantic/Bermuda' },
  VG: { code: 'VG', name: 'British Virgin Islands', nameJa: '英領ヴァージン諸島', currency: 'USD', timezones: ['America/Tortola'], defaultTimezone: 'America/Tortola' },
  TC: { code: 'TC', name: 'Turks and Caicos Islands', nameJa: 'タークス・カイコス諸島', currency: 'USD', timezones: ['America/Grand_Turk'], defaultTimezone: 'America/Grand_Turk' },
  AW: { code: 'AW', name: 'Aruba', nameJa: 'アルバ', currency: 'AWG', timezones: ['America/Aruba'], defaultTimezone: 'America/Aruba' },
  CW: { code: 'CW', name: 'Curaçao', nameJa: 'キュラソー', currency: 'ANG', timezones: ['America/Curacao'], defaultTimezone: 'America/Curacao' },
  SX: { code: 'SX', name: 'Sint Maarten', nameJa: 'シント・マールテン', currency: 'ANG', timezones: ['America/Lower_Princes'], defaultTimezone: 'America/Lower_Princes' },
}

// 主要都市マッピング（小文字でキー管理）
export const CITIES: Record<string, CityInfo> = {
  // 日本の主要都市
  'kyoto': { name: '京都', countryCode: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY' },
  'osaka': { name: '大阪', countryCode: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY' },
  'sapporo': { name: '札幌', countryCode: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY' },
  'tokyo': { name: '東京', countryCode: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY' },
  
  // アメリカ（米国）の主要都市
  'chicago': { name: 'Chicago', countryCode: 'US', timezone: 'America/Chicago', currency: 'USD' },
  'las vegas': { name: 'Las Vegas', countryCode: 'US', timezone: 'America/Los_Angeles', currency: 'USD' },
  'los angeles': { name: 'Los Angeles', countryCode: 'US', timezone: 'America/Los_Angeles', currency: 'USD' },
  'miami': { name: 'Miami', countryCode: 'US', timezone: 'America/New_York', currency: 'USD' },
  'new york': { name: 'New York', countryCode: 'US', timezone: 'America/New_York', currency: 'USD' },
  'san francisco': { name: 'San Francisco', countryCode: 'US', timezone: 'America/Los_Angeles', currency: 'USD' },
  
  // ヨーロッパの主要都市
  'amsterdam': { name: 'Amsterdam', countryCode: 'NL', timezone: 'Europe/Amsterdam', currency: 'EUR' },
  'berlin': { name: 'Berlin', countryCode: 'DE', timezone: 'Europe/Berlin', currency: 'EUR' },
  'london': { name: 'London', countryCode: 'GB', timezone: 'Europe/London', currency: 'GBP' },
  'madrid': { name: 'Madrid', countryCode: 'ES', timezone: 'Europe/Madrid', currency: 'EUR' },
  'paris': { name: 'Paris', countryCode: 'FR', timezone: 'Europe/Paris', currency: 'EUR' },
  'rome': { name: 'Rome', countryCode: 'IT', timezone: 'Europe/Rome', currency: 'EUR' },
  
  // アジアの主要都市
  'bangkok': { name: 'Bangkok', countryCode: 'TH', timezone: 'Asia/Bangkok', currency: 'THB' },
  'beijing': { name: 'Beijing', countryCode: 'CN', timezone: 'Asia/Shanghai', currency: 'CNY' },
  'hong kong': { name: 'Hong Kong', countryCode: 'HK', timezone: 'Asia/Hong_Kong', currency: 'HKD' },
  'seoul': { name: 'Seoul', countryCode: 'KR', timezone: 'Asia/Seoul', currency: 'KRW' },
  'shanghai': { name: 'Shanghai', countryCode: 'CN', timezone: 'Asia/Shanghai', currency: 'CNY' },
  'singapore': { name: 'Singapore', countryCode: 'SG', timezone: 'Asia/Singapore', currency: 'SGD' },
  'taipei': { name: 'Taipei', countryCode: 'TW', timezone: 'Asia/Taipei', currency: 'TWD' },
  
  // オセアニアの主要都市
  'auckland': { name: 'Auckland', countryCode: 'NZ', timezone: 'Pacific/Auckland', currency: 'NZD' },
  'melbourne': { name: 'Melbourne', countryCode: 'AU', timezone: 'Australia/Melbourne', currency: 'AUD' },
  'sydney': { name: 'Sydney', countryCode: 'AU', timezone: 'Australia/Sydney', currency: 'AUD' },
  
  // 太平洋諸島の主要都市
  'guam': { name: 'Guam', countryCode: 'GU', timezone: 'Pacific/Guam', currency: 'USD' },
  'honolulu': { name: 'Honolulu', countryCode: 'US', timezone: 'Pacific/Honolulu', currency: 'USD' },
  'saipan': { name: 'Saipan', countryCode: 'MP', timezone: 'Pacific/Saipan', currency: 'USD' },
  
  // インド・南アジアの主要都市
  'bangalore': { name: 'Bangalore', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  'chennai': { name: 'Chennai', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  'delhi': { name: 'Delhi', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  'kolkata': { name: 'Kolkata', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  'mumbai': { name: 'Mumbai', countryCode: 'IN', timezone: 'Asia/Kolkata', currency: 'INR' },
  
  // その他の代表的な都市
  'dubai': { name: 'Dubai', countryCode: 'AE', timezone: 'Asia/Dubai', currency: 'AED' },
  'istanbul': { name: 'Istanbul', countryCode: 'TR', timezone: 'Europe/Istanbul', currency: 'TRY' },
  'moscow': { name: 'Moscow', countryCode: 'RU', timezone: 'Europe/Moscow', currency: 'RUB' },
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

