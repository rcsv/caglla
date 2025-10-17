// 共通型定義ファイル
// このファイルに全ての型定義を集約し、重複を排除する

// ============================================================================
// Firestore型定義
// ============================================================================

// Firestore Timestamp型の型定義
export interface FirestoreTimestamp {
  seconds: number
  nanoseconds: number
  toDate(): Date
  toMillis(): number
  isEqual(other: FirestoreTimestamp): boolean
  valueOf(): string
}

// Firestoreから取得される日付型（Timestamp、Date、stringのいずれか）
export type FirestoreDate = FirestoreTimestamp | Date | string

// ============================================================================
// 基本型定義
// ============================================================================

export interface UserPreferences {
  currency?: string
  home_address?: string
  timezone?: string
  language?: string
  theme?: 'light' | 'dark'
  notifications?: boolean
  home_country_code?: string // ユーザーの居住国（ISO 3166-1 alpha-2）
}

export interface User {
  id: string
  google_id: string
  name: string
  email: string
  slug?: string // URL-safe スラッグ
  profile_image_url?: string
  preferences?: UserPreferences
  created_at: FirestoreDate
  updated_at: FirestoreDate
  planId?: 'season_traveler' | 'backpacker' | 'globetrotter' | 'planner_pro' | 'enterprise'
  storageUsage?: StorageUsage
}

// ============================================================================
// ストレージ使用量管理
// ============================================================================

export interface StorageUsage {
  totalBytes: number
  fileCount: number
  lastUpdated: FirestoreDate
  files: StorageFile[]
}

export interface StorageFile {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  storagePath: string
  downloadUrl: string
  uploadedAt: FirestoreDate
  tripId?: string
  isAvatar?: boolean
}

export interface StorageQuota {
  planId: 'season_traveler' | 'backpacker' | 'globetrotter' | 'planner_pro' | 'enterprise'
  maxBytes: number
  maxFiles: number
  description: string
}

// ============================================================================
// 場所・地理情報関連
// ============================================================================

export interface PlaceData {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  // Basic Data（無料）
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  vicinity?: string // 周辺情報（短縮住所）
  business_status?: string // 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'
  types?: string[]
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  url?: string // Google MapsのURL
  icon?: string // アイコンURL
  // Contact Data（$3.00/1,000件）
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string
  opening_hours?: {
    open_now?: boolean // リアルタイム情報
    weekday_text?: string[]
  }
  // Atmosphere Data（$5.00/1,000件）
  rating?: number
  user_ratings_total?: number
  price_level?: number
  editorial_summary?: {
    overview: string
  }
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    time: number
    relative_time_description?: string
  }>
}

// ============================================================================
// Google Places API Cache
// ============================================================================

export interface PlacesCache {
  // スキーマバージョン管理
  format_version: string
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  // Basic Data（無料）
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  vicinity?: string
  business_status?: string
  types?: string[]
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  url?: string
  icon?: string
  // Contact Data（$3.00/1,000件）
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string
  opening_hours?: {
    open_now?: boolean // リアルタイム情報（キャッシュから除外推奨）
    weekday_text?: string[]
  }
  // Atmosphere Data（$5.00/1,000件）
  rating?: number
  user_ratings_total?: number
  price_level?: number
  editorial_summary?: {
    overview: string
  }
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    time: number
    relative_time_description?: string
  }>
  // メタデータ
  cached_at: FirestoreDate
  last_accessed: FirestoreDate
  access_count: number
}

// ============================================================================
// アクティビティタグ関連
// ============================================================================

/**
 * アクティビティタグ（2段階分類）
 */
export interface ActivityTag {
  primaryCategory: PrimaryCategoryType
  secondaryCategory: string // 1段階目に応じた詳細カテゴリー
}

/**
 * 1段階目カテゴリー（大分類）
 */
export type PrimaryCategoryType =
  | 'transportation'  // 乗り物に乗る
  | 'shopping'        // 買い物をする
  | 'dining'          // 食事をする
  | 'accommodation'   // 宿泊する
  | 'exploration'     // 探索する
  | 'adventure'       // 探検する
  | 'entertainment'   // 遊ぶ
  | 'culture'         // 文化に触れる
  | 'wellness'        // 健康志向
  | 'service'         // サービス提供

/**
 * チェックリスト項目
 */
export interface ChecklistItem {
  id: string
  title: string
  description?: string
  category: 'preparation' | 'packing' // 行動系準備 or パッキング系
  done: boolean
  generatedFrom?: string // 生成元のsecondaryCategory ID
  isCustom?: boolean // ユーザーが手動追加した項目
  priority?: 'high' | 'medium' | 'low'
}

/**
 * Trip Checklist（旅行全体のチェックリスト）
 */
export interface TripChecklist {
  id: string
  trip_id: string
  items: ChecklistItem[]
  last_generated_at: FirestoreDate
  created_at: FirestoreDate
  updated_at: FirestoreDate
}

/**
 * Checklist Preset Item（プリセット内のアイテム）
 */
export interface ChecklistPresetItem {
  title: string
  description?: string
  category: 'preparation' | 'packing'
  priority?: 'high' | 'medium' | 'low'
}

/**
 * Checklist Preset（ユーザー作成のチェックリストテンプレート）
 */
export interface ChecklistPreset {
  id: string
  user_id: string
  title: string
  description?: string
  tags?: string[] // 検索用タグ（例: ["winter", "hokkaido", "skiing"]）
  items: ChecklistPresetItem[]
  is_public: boolean // 公開/非公開フラグ
  created_at: FirestoreDate
  updated_at: FirestoreDate
  usage_count?: number // 使用回数（人気度の指標）
}

/**
 * アクティビティ統計
 */
export interface ActivityStats {
  primaryCategories: {
    [key in PrimaryCategoryType]?: {
      count: number
      percentage: number
    }
  }
  secondaryCategories: {
    [key: string]: number
  }
  totalActivities: number
}

// ============================================================================
// 旅行・旅程関連
// ============================================================================

export interface Itinerary {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  // Firestoreには place_id を保存し、実体は places_cache から解決する
  place_id?: string | null
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number | null
  cost_currency?: string
  // アクティビティタグ（2段階分類）
  activity_tag?: ActivityTag | null
  created_at: FirestoreDate
  updated_at: FirestoreDate
}

export interface Day {
  id: string
  trip_id: string
  day_number: number
  date: FirestoreDate
  description?: string
  created_at: FirestoreDate
  updated_at: FirestoreDate
  itineraries?: Itinerary[]
}

export interface Trip {
  id: string
  user_id: string
  title: string
  slug?: string // URL-safe スラッグ
  description?: string
  destination?: string // 後方互換性のため残す
  // Firestoreには destination_place_id を保存し、実体は places_cache から解決する
  destination_place_id?: string
  destination_place?: PlaceData // UI向けに解決済みのデータ（読み取り時に付与）
  start_date?: FirestoreDate
  end_date?: FirestoreDate
  status: string
  access_level: 'private' | 'public'
  image_url?: string
  created_at: FirestoreDate
  updated_at: FirestoreDate
  days?: Day[]
  creator?: User
}

export interface TripUser {
  id: string
  trip_id: string
  user_id: string
  created_at: FirestoreDate
}

// ============================================================================
// API レスポンス用の型
// ============================================================================

export interface TripResponse extends Trip {
  // APIから返される追加フィールドがあればここに追加
}

export interface ItineraryResponse extends Itinerary {
  // APIから返される追加フィールドがあればここに追加
}

export interface DayResponse extends Day {
  // APIから返される追加フィールドがあればここに追加
}

// ============================================================================
// フォーム用の型（オプショナルフィールドを必須にする）
// ============================================================================

export interface TripFormData {
  title: string
  description?: string
  start_date: string
  end_date: string
  access_level: 'private' | 'public'
  image_url?: string
  destination?: string
}

export interface ItineraryFormData {
  title: string
  description?: string
  location?: string
  // 新設: 保存は place_id を推奨（place_data は後方互換）
  place_id?: string | null
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number | null
  cost_currency?: string
  activity_tag?: ActivityTag | null
}

export interface DayFormData {
  day_number: number
  description?: string
}

// ============================================================================
// その他の型定義
// ============================================================================

export interface BrowserInfo {
  currency: string
  timezone: string
  language: string
  homeAddress?: string
}

export interface WeatherData {
  date: string
  temperature_2m_max: number
  temperature_2m_min: number
  weathercode: number
  precipitation_sum: number
  windspeed_10m_max: number
  winddirection_10m_dominant: number
}

export interface WeatherForecast {
  latitude: number
  longitude: number
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weathercode: number[]
    precipitation_sum: number[]
    windspeed_10m_max: number[]
    winddirection_10m_dominant: number[]
  }
  daily_units: {
    temperature_2m_max: string
    temperature_2m_min: string
    weathercode: string
    precipitation_sum: string
    windspeed_10m_max: string
    winddirection_10m_dominant: string
  }
}

export interface WeatherSummary {
  averageTemp: number
  minTemp: number
  maxTemp: number
  rainyDays: number
  totalPrecipitation: number
  averageWindSpeed: number
  dominantWeather: string
  forecastDays: number
  availableDays: number
  isPartialForecast: boolean
}

export interface DistanceMatrixResult {
  distance: {
    text: string
    value: number
  }
  duration: {
    text: string
    value: number
  }
  status: string
}

export interface DistanceMatrixResponse {
  destination_addresses: string[]
  origin_addresses: string[]
  rows: Array<{
    elements: DistanceMatrixResult[]
  }>
  status: string
}

export interface GeocodingResult {
  place_id: string
  formatted_address: string
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
}

export interface GeocodingResponse {
  results: GeocodingResult[]
  status: string
}

export interface PlaceSearchResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
  rating?: number
  price_level?: number
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
}

// PlaceDetailsResultはPlaceDataと同じ（後方互換性のためのエイリアス）
export interface PlaceDetailsResult extends PlaceData {}

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  country: string
}

export interface CostSummary {
  currency: string
  total: number
  count: number
  currencyInfo: {
    code: string
    name: string
    symbol: string
    country: string
  }
}

export interface TripCostSummary {
  totalCosts: CostSummary[]
  hasCosts: boolean
}

export interface TimezoneInfo {
  timezone: string
  offset: number // UTCからのオフセット（分）
  city: string
  country: string
}

// タイムゾーン推定失敗ログ
export interface TimezoneFailureLog {
  id: string
  place_data: PlaceData
  failure_reason: 'city_not_found' | 'country_not_found' | 'address_parse_failed'
  detected_city?: string
  detected_country?: string
  formatted_address: string
  created_at: FirestoreDate
  user_id?: string
  status: 'pending' | 'processed' | 'ignored'
}

// バッチ更新用のタイムゾーンマッピング
export interface TimezoneMappingUpdate {
  city_name: string
  timezone: string
  confidence: 'high' | 'medium' | 'low'
  source: 'user_feedback' | 'batch_analysis' | 'manual'
  created_at: FirestoreDate
}

// 通貨推定失敗ログ
export interface CurrencyFailureLog {
  id: string
  place_data: PlaceData
  failure_reason: 'country_not_found' | 'city_not_found' | 'address_parse_failed'
  detected_city?: string
  detected_country?: string
  formatted_address: string
  created_at: FirestoreDate
  user_id?: string
  status: 'pending' | 'processed' | 'ignored'
}

// バッチ更新用の通貨マッピング
export interface CurrencyMappingUpdate {
  city_name: string
  currency: string
  confidence: 'high' | 'medium' | 'low'
  source: 'user_feedback' | 'batch_analysis' | 'manual'
  created_at: FirestoreDate
}

export interface CountryCoordinate {
  countryCode: string
  countryName: string
  countryNameJa: string
  lat: number
  lng: number
}

export interface CountryGroup {
  countryCode: string
  countryName: string
  countryNameJa: string
  tripCount: number
  trips: Array<{
    id: string
    title: string
    destination?: string
    startDate?: FirestoreDate
    endDate?: FirestoreDate
    imageUrl?: string
  }>
}

// ============================================================================
// Unsplash API関連
// ============================================================================

export interface UnsplashPhoto {
  id: string
  created_at: string
  updated_at: string
  promoted_at?: string
  width: number
  height: number
  color: string
  blur_hash: string
  description?: string
  alt_description?: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
    small_s3: string
  }
  links: {
    self: string
    html: string
    download: string
    download_location: string
  }
  likes: number
  liked_by_user: boolean
  current_user_collections: any[]
  sponsorship?: any
  topic_submissions: any
  user: {
    id: string
    updated_at: string
    username: string
    name: string
    first_name: string
    last_name?: string
    twitter_username?: string
    portfolio_url?: string
    bio?: string
    location?: string
    links: {
      self: string
      html: string
      photos: string
      likes: string
      portfolio: string
      following: string
      followers: string
    }
    profile_image: {
      small: string
      medium: string
      large: string
    }
    instagram_username?: string
    total_collections: number
    total_likes: number
    total_photos: number
    accepted_tos: boolean
    for_hire: boolean
    social: {
      instagram_username?: string
      portfolio_url?: string
      twitter_username?: string
      paypal_email?: string
    }
  }
}

export interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

export interface UnsplashRandomResponse {
  id: string
  created_at: string
  updated_at: string
  promoted_at?: string
  width: number
  height: number
  color: string
  blur_hash: string
  description?: string
  alt_description?: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
    small_s3: string
  }
  links: {
    self: string
    html: string
    download: string
    download_location: string
  }
  likes: number
  liked_by_user: boolean
  current_user_collections: any[]
  sponsorship?: any
  topic_submissions: any
  user: {
    id: string
    updated_at: string
    username: string
    name: string
    first_name: string
    last_name?: string
    twitter_username?: string
    portfolio_url?: string
    bio?: string
    location?: string
    links: {
      self: string
      html: string
      photos: string
      likes: string
      portfolio: string
      following: string
      followers: string
    }
    profile_image: {
      small: string
      medium: string
      large: string
    }
    instagram_username?: string
    total_collections: number
    total_likes: number
    total_photos: number
    accepted_tos: boolean
    for_hire: boolean
    social: {
      instagram_username?: string
      portfolio_url?: string
      twitter_username?: string
      paypal_email?: string
    }
  }
}

// ============================================================================
// 環境変数関連
// ============================================================================

export interface RequiredEnvVars {
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: string
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string
  NEXT_PUBLIC_FIREBASE_APP_ID: string
  
  // Firebase Admin SDK Configuration
  FIREBASE_PROJECT_ID: string
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_PRIVATE_KEY: string
  
  // Google Places API
  NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: string
  
  // Google Maps API
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string
  
  // Unsplash API
  NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: string
}

export interface OptionalEnvVars {
  NEXT_PUBLIC_GOOGLE_MAP_ID?: string
  UNSPLASH_ACCESS_KEY?: string
  UNSPLASH_SECRET_KEY?: string
  DB_HOST?: string
  DB_USER?: string
  DB_PASSWORD?: string
  DB_NAME?: string
  // External Venue APIs (サーバーサイド専用)
  TRIPADVISOR_API_KEY?: string
  FOURSQUARE_API_KEY?: string
}

// ============================================================================
// コンポーネント Props 型定義
// ============================================================================

export interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface TripEditorProps {
  trip: Trip
  onUpdate: (updatedTrip: Trip) => void
  onDelete?: () => void
}

export interface TripMapProps {
  trips: Trip[]
  center?: { lat: number; lng: number }
  zoom?: number
}

export interface TripWeatherDisplayProps {
  trip: Trip
}

export interface TripDistanceDisplayProps {
  trip: Trip
}

export interface TripCostDisplayProps {
  trip: Trip
}

export interface ScheduleCardProps {
  itinerary: Itinerary
  onUpdate: (updatedItinerary: Itinerary) => void
  onDelete: () => void
}

export interface VenueDistanceProps {
  fromPlace: PlaceData
  toPlace: PlaceData
}

export interface PlaceSearchInputProps {
  currentPlace?: PlaceData | null
  onPlaceSelect: (place: PlaceData | null) => void
  placeholder?: string
  disabled?: boolean
}

export interface DayEditorProps {
  day: Day
  onUpdate: (updatedDay: Day) => void
  onDelete: () => void
}

export interface ItineraryDropZoneProps {
  dayId: string
  onItineraryAdd: (itinerary: Itinerary) => void
}

export interface DayDropZoneProps {
  tripId: string
  onDayAdd: (day: Day) => void
}

export interface AddScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (itinerary: ItineraryFormData) => void
  dayId: string
}

export interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  tripId: string
  disabled?: boolean
}

export interface AvatarUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  userId: string
  disabled?: boolean
}

export interface CountryMapProps {
  countries: string[]
  center?: { lat: number; lng: number }
  zoom?: number
}

export interface CountryStatsProps {
  userId: string
}

// ============================================================================
// 認証関連
// ============================================================================

export interface AuthContextType {
  user: any | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}
