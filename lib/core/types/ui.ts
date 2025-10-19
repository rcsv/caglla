/**
 * UIコンポーネント Props 型定義
 */

import type { Trip, Day, Itinerary } from './trip'
import type { PlaceData } from './place'
import type { ItineraryFormData } from './api'

// ============================================================================
// コンポーネント Props 型定義
// ============================================================================

/**
 * ユーザー設定モーダル Props
 */
export interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Trip編集コンポーネント Props
 */
export interface TripEditorProps {
  trip: Trip
  onUpdate: (updatedTrip: Trip) => void
  onDelete?: () => void
}

/**
 * Tripマップコンポーネント Props
 */
export interface TripMapProps {
  trips: Trip[]
  center?: { lat: number; lng: number }
  zoom?: number
}

/**
 * Trip天気表示コンポーネント Props
 */
export interface TripWeatherDisplayProps {
  trip: Trip
}

/**
 * Trip距離表示コンポーネント Props
 */
export interface TripDistanceDisplayProps {
  trip: Trip
}

/**
 * Tripコスト表示コンポーネント Props
 */
export interface TripCostDisplayProps {
  trip: Trip
}

/**
 * スケジュールカードコンポーネント Props
 */
export interface ScheduleCardProps {
  itinerary: Itinerary
  onUpdate: (updatedItinerary: Itinerary) => void
  onDelete: () => void
}

/**
 * 会場間距離表示コンポーネント Props
 */
export interface VenueDistanceProps {
  fromPlace: PlaceData
  toPlace: PlaceData
}

/**
 * 場所検索入力コンポーネント Props
 */
export interface PlaceSearchInputProps {
  currentPlace?: PlaceData | null
  onPlaceSelect: (place: PlaceData | null) => void
  placeholder?: string
  disabled?: boolean
}

/**
 * Day編集コンポーネント Props
 */
export interface DayEditorProps {
  day: Day
  onUpdate: (updatedDay: Day) => void
  onDelete: () => void
}

/**
 * Itineraryドロップゾーンコンポーネント Props
 */
export interface ItineraryDropZoneProps {
  dayId: string
  onItineraryAdd: (itinerary: Itinerary) => void
}

/**
 * Dayドロップゾーンコンポーネント Props
 */
export interface DayDropZoneProps {
  tripId: string
  onDayAdd: (day: Day) => void
}

/**
 * スケジュール追加モーダルコンポーネント Props
 */
export interface AddScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (itinerary: ItineraryFormData) => void
  dayId: string
}

/**
 * 画像アップロードコンポーネント Props
 */
export interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  tripId: string
  disabled?: boolean
}

/**
 * アバターアップロードコンポーネント Props
 */
export interface AvatarUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  userId: string
  disabled?: boolean
}

/**
 * 国別マップコンポーネント Props
 */
export interface CountryMapProps {
  countries: string[]
  center?: { lat: number; lng: number }
  zoom?: number
}

/**
 * 国別統計コンポーネント Props
 */
export interface CountryStatsProps {
  userId: string
}

