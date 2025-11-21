import type { Trip, TripSocialStats } from '@/lib/core/types'

export type ResolvedTripSocialStats = {
  likes: number
  comments: number
  shares: number
  views: number
  replicas: number
}

const ZERO_STATS: TripSocialStats = {
  likes_count: 0,
  comments_count: 0,
  shares_count: 0,
  views_count: 0,
  replicas_count: 0,
}

export function resolveSocialStats(trip: Trip): ResolvedTripSocialStats {
  const s = trip.social_stats ?? ZERO_STATS

  return {
    likes: s.likes_count ?? (typeof trip.likes_count === 'number' ? trip.likes_count : 0),
    comments: s.comments_count ?? 0,
    shares: s.shares_count ?? 0,
    views: s.views_count ?? 0,
    replicas: s.replicas_count ?? 0,
  }
}


