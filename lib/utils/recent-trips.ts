import { Trip } from '@/lib/core/types'

const RECENT_TRIPS_KEY = 'recent_trips_v1'

export interface RecentTripEntry {
  tripId: string
  slug: string
  creatorSlug: string
  title: string
  destination?: string
  destinationPlaceId?: string
  viewedAt: string // ISO 8601
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getRecentTrips(): RecentTripEntry[] {
  if (!isBrowser()) return []

  try {
    const raw = window.localStorage.getItem(RECENT_TRIPS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentTripEntry[]
  } catch {
    try {
      window.localStorage.removeItem(RECENT_TRIPS_KEY)
    } catch {
      // noop
    }
    return []
  }
}

function safeSetRecentTrips(list: RecentTripEntry[]) {
  if (!isBrowser()) return

  const write = () => {
    try {
      window.localStorage.setItem(RECENT_TRIPS_KEY, JSON.stringify(list))
    } catch {
      // 容量オーバーなどは黙って無視（履歴が残らないだけなら致命的ではない）
    }
  }

  const anyWindow = window as any
  if (typeof anyWindow.requestIdleCallback === 'function') {
    anyWindow.requestIdleCallback(write)
  } else {
    write()
  }
}

export function addRecentTrip(entry: RecentTripEntry): void {
  if (!isBrowser()) return

  const list = getRecentTrips()
  const filtered = list.filter((item) => item.tripId !== entry.tripId)
  const next = [entry, ...filtered].slice(0, 5)

  safeSetRecentTrips(next)
}

/**
 * Trip モデルから RecentTripEntry を生成するヘルパー。
 * 呼び出し側で userSlug / viewedAt を渡す前提。
 */
export function buildRecentTripEntry(params: {
  trip: Trip
  userSlug: string
  viewedAt: string
}): RecentTripEntry | null {
  const { trip, userSlug, viewedAt } = params
  if (!trip.id) return null

  const slug = trip.slug || ''
  const creatorSlug = trip.creator?.slug || userSlug || ''

  return {
    tripId: trip.id,
    slug,
    creatorSlug,
    title: trip.title || trip.destination || 'Untitled Trip',
    destination: trip.destination_place?.name || trip.destination || undefined,
    destinationPlaceId: trip.destination_place_id || undefined,
    viewedAt,
  }
}


