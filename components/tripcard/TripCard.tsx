'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/common/Card'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import PublicAccessBadge from '@/components/common/icons/PublicAccessBadge'
import { dateUtils } from '@/lib/utils/date'
import { getCountryFlag } from '@/lib/utils/country-flags'
import { getUserLanguage } from '@/lib/utils/language'
import logger from '@/lib/core/logger'
import type { Trip } from '@/lib/core/types'
import { Icon } from '@iconify/react'
import { t } from '@/lib/i18n'

type TripCardVariant = 'standard' | 'imageFull' | 'horizontal'

type TripAccent = 'ongoing' | 'upcoming' | 'template' | 'past'

export interface TripCardProps {
  trip: Trip
  isPastTrip?: boolean
  variant?: TripCardVariant
  priority?: boolean // LCP画像用のpriority属性
  accent?: TripAccent
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  isPastTrip = false,
  variant = 'standard',
  priority = false,
  accent,
}) => {
        const router = useRouter()
        // スラッグベースのURLを生成
        const getTripUrl = () => {
          if (trip.creator?.slug && trip.slug) {
            return `/${trip.creator.slug}/${trip.slug}`
          }
          // スラッグが存在しない場合はホームへ（データ不整合）
          logger.warn('Trip missing slug data', { 
            tripId: trip.id, 
            hasCreator: !!trip.creator,
            creatorSlug: trip.creator?.slug,
            tripSlug: trip.slug,
            tripTitle: trip.title
          })
          return '/home'
        }

  // Social Statsの取得（v3.0.0対応）
  // social_statsを優先的に使用、なければ既存のlikes_countをフォールバック
  const likesCount = trip.social_stats?.likes_count ?? (typeof trip.likes_count === 'number' ? trip.likes_count : 0)
  const commentsCount = trip.social_stats?.comments_count ?? 0
  const sharesCount = trip.social_stats?.shares_count ?? 0

  const LikeBadge = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
    if (likesCount <= 0) return null
    const baseClass =
      size === 'md'
        ? 'inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-sm'
        : 'inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs text-rose-600 shadow-sm'

    const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'

    return (
      <span className={baseClass} aria-label={t('trip.likes.count', { count: likesCount })}>
        <Icon icon="mdi:heart" className={iconClass} aria-hidden="true" />
        <span className="tabular-nums">{likesCount}</span>
      </span>
    )
  }

  // Social Stats表示コンポーネント（いいね・コメント・シェア）
  const SocialStats = ({ size = 'sm', showComments = true }: { size?: 'sm' | 'md'; showComments?: boolean }) => {
    const hasStats = likesCount > 0 || (showComments && commentsCount > 0) || sharesCount > 0
    if (!hasStats) return null

    const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
    const textClass = size === 'md' ? 'text-xs' : 'text-xs'

    return (
      <div className="flex items-center gap-3">
        {likesCount > 0 && (
          <span className="inline-flex items-center gap-1 text-gray-600" aria-label={t('trip.likes.count', { count: likesCount })}>
            <Icon icon="mdi:heart" className={iconClass} aria-hidden="true" />
            <span className={`tabular-nums ${textClass}`}>{likesCount}</span>
          </span>
        )}
        {showComments && commentsCount > 0 && (
          <span className="inline-flex items-center gap-1 text-gray-600" aria-label={`${commentsCount} comments`}>
            <Icon icon="mdi:comment-outline" className={iconClass} aria-hidden="true" />
            <span className={`tabular-nums ${textClass}`}>{commentsCount}</span>
          </span>
        )}
        {sharesCount > 0 && (
          <span className="inline-flex items-center gap-1 text-gray-600" aria-label={`${sharesCount} shares`}>
            <Icon icon="mdi:share-variant" className={iconClass} aria-hidden="true" />
            <span className={`tabular-nums ${textClass}`}>{sharesCount}</span>
          </span>
        )}
      </div>
    )
  }

  // access_levelの型安全性を確保
  const accessLevel = trip.access_level === 'public' || trip.access_level === 'private' 
    ? trip.access_level 
    : 'private'

  const accentBorderClass =
    accent === 'ongoing'
      ? 'border-l-4 border-l-indigo-400'
      : accent === 'upcoming'
      ? 'border-l-4 border-l-emerald-400'
      : accent === 'template'
      ? 'border-l-4 border-l-amber-300'
      : accent === 'past'
      ? 'border-l-4 border-l-gray-300'
      : ''

  // 横長バリアント（Recommended trips用）
  if (variant === 'horizontal') {
    return (
      <Link href={getTripUrl()} className="block group">
        <div
          className={`relative overflow-hidden rounded-md shadow-sm hover:shadow-md transition bg-gray-900 h-24 md:h-20 ${accentBorderClass}`}
        >
          {/* Background Image */}
          {trip.image_url && (
            <Image
              src={trip.image_url}
              alt={trip.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              className="object-cover"
            />
          )}
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-slate-900/40" />
          <div className="absolute top-2 right-2">
            <LikeBadge size="md" />
          </div>
          
          {/* Content */}
          <div className="relative h-full px-4 py-3 md:px-5 md:py-4 flex flex-col gap-1.5 md:gap-2 text-white">
            <h3 className="text-base md:text-lg font-bold drop-shadow-sm leading-tight line-clamp-1 md:line-clamp-2">
              {trip.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/85">
              {trip.destination && (
                <span className="flex items-center gap-1">
                  <IconRenderer iconName="pin" className="w-3 h-3" color="white" />
                  {trip.destination}
                </span>
              )}
              {trip.destination_place?.address_components && (
                <span className="text-sm">
                  {getCountryFlag(
                    trip.destination_place.address_components
                      .find((component: any) => component.types.includes('country'))
                      ?.short_name || 'unknown'
                  )}
                </span>
              )}
              {trip.start_date && trip.end_date && (
                <span className="flex items-center gap-1">
                  <IconRenderer iconName="calendar" className="w-3 h-3" color="white" />
                  {(() => {
                    const language = getUserLanguage()
                    const { futureTrips, pastTrips } = dateUtils.sortTripsByDate([trip])
                    if (futureTrips.length > 0) {
                      return dateUtils.formatFutureTripDate(trip.start_date, trip.end_date, language)
                    } else if (pastTrips.length > 0) {
                      return dateUtils.formatPastTripDate(trip.start_date, trip.end_date, language)
                    } else {
                      return dateUtils.formatDateRange(trip.start_date, trip.end_date, language)
                    }
                  })()}
                </span>
              )}
              {trip.creator?.name && trip.creator?.slug && (
                <button
                  type="button"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/${trip.creator!.slug}`)
                  }}
                >
                  {trip.creator.profile_image_url ? (
                    <Image
                      src={trip.creator.profile_image_url}
                      alt={trip.creator.name}
                      width={20}
                      height={20}
                      className="rounded-full object-cover border border-white/30 shadow-sm"
                    />
                  ) : (
                    <IconRenderer iconName="user" className="w-3 h-3" color="white" />
                  )}
                  <span className="font-medium text-white/90">{trip.creator.name}</span>
                </button>
              )}
            </div>
            
            {/* Social Stats（いいね・コメント・シェア） */}
            <div className="mt-2">
              <div className="flex items-center gap-3">
                {likesCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-white/85" aria-label={t('trip.likes.count', { count: likesCount })}>
                    <Icon icon="mdi:heart" className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-xs tabular-nums">{likesCount}</span>
                  </span>
                )}
                {commentsCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-white/85" aria-label={`${commentsCount} comments`}>
                    <Icon icon="mdi:comment-outline" className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-xs tabular-nums">{commentsCount}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'imageFull') {
    return (
      <Link href={getTripUrl()} className="block group">
        <div
          className={`relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition bg-gray-900 h-[28rem] ${accentBorderClass}`}
        >
          {/* Image */}
          {trip.image_url && (
            <Image
              src={trip.image_url}
              alt={trip.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              className={`object-cover ${isPastTrip ? 'sepia' : ''}`}
              style={isPastTrip ? { filter: 'sepia(0.25) contrast(1.05) brightness(0.95)' } : {}}
            />
          )}
          {/* Top-right badge with better visibility */}
          <div className="absolute top-3 right-3 z-10">
            <PublicAccessBadge 
              accessLevel={accessLevel} 
              size="sm"
              className="drop-shadow-md"
            />
          </div>
          <div className="absolute top-3 left-3 z-10">
            <LikeBadge size="md" />
          </div>
          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          {/* Text content */}
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <h3 className="text-3xl md:text-4xl font-bold drop-shadow-md line-clamp-2">{trip.title}</h3>
            {trip.description && (
              <p className="mt-2 text-sm text-white/85 line-clamp-2">{trip.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/85">
              {trip.destination && (
                <span className="px-2 py-1 bg-white/10 rounded-full flex items-center gap-1">
                  <IconRenderer iconName="pin" className="w-3 h-3" color="white" />
                  {trip.destination}
                </span>
              )}
              {trip.destination_place?.address_components && (
                <span className="px-2 py-1 bg-white/10 rounded-full flex items-center gap-1">
                  <span className="text-sm">
                    {getCountryFlag(
                      trip.destination_place.address_components
                        .find((component: any) => component.types.includes('country'))
                        ?.short_name || 'unknown'
                    )}
                  </span>
                </span>
              )}
              {trip.start_date && trip.end_date && (
                <span className="px-2 py-1 bg-white/10 rounded-full">
                  {(() => {
                    const language = getUserLanguage()
                    const { futureTrips, pastTrips } = dateUtils.sortTripsByDate([trip])
                    if (futureTrips.length > 0) {
                      return dateUtils.formatFutureTripDate(trip.start_date, trip.end_date, language)
                    } else if (pastTrips.length > 0) {
                      return dateUtils.formatPastTripDate(trip.start_date, trip.end_date, language)
                    } else {
                      return dateUtils.formatDateRange(trip.start_date, trip.end_date, language)
                    }
                  })()}
                </span>
              )}
            </div>
            
            {/* Social Stats（いいね・コメント・シェア） */}
            <div className="mt-3">
              <div className="flex items-center gap-3">
                {likesCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-white/85" aria-label={t('trip.likes.count', { count: likesCount })}>
                    <Icon icon="mdi:heart" className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-xs tabular-nums">{likesCount}</span>
                  </span>
                )}
                {commentsCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-white/85" aria-label={`${commentsCount} comments`}>
                    <Icon icon="mdi:comment-outline" className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-xs tabular-nums">{commentsCount}</span>
                  </span>
                )}
                {sharesCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-white/85" aria-label={`${sharesCount} shares`}>
                    <Icon icon="mdi:share-variant" className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-xs tabular-nums">{sharesCount}</span>
                  </span>
                )}
              </div>
            </div>
            
            {/* 作成者情報 */}
            {trip.creator?.name && trip.creator?.slug && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 text-white/85 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/${trip.creator!.slug}`)
                  }}
                >
                  {trip.creator.profile_image_url ? (
                    <Image
                      src={trip.creator.profile_image_url}
                      alt={trip.creator.name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover border border-white/30"
                    />
                  ) : (
                    <IconRenderer iconName="user" className="w-5 h-5" color="white" />
                  )}
                  <span className="text-sm font-medium">{trip.creator.name}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // standard
  return (
    <Link href={getTripUrl()} className="block group">
      <Card
        interactive
        padding="md"
        className={`h-full ${accentBorderClass}`}
      >
        {trip.image_url && (
          <div className="mb-4">
            <div className={`relative w-full h-32 rounded-lg overflow-hidden ${isPastTrip ? 'shadow-inner-burned' : ''}`}>
              <Image
                src={trip.image_url}
                alt={trip.title}
                width={400}
                height={128}
                className={`w-full h-32 object-cover rounded-lg ${isPastTrip ? 'sepia filter-grayscale-20' : ''}`}
                style={isPastTrip ? { filter: 'sepia(0.3) contrast(1.1) brightness(0.9)' } : {}}
              />
              {isPastTrip && (
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 20px rgba(139, 69, 19, 0.3), inset 0 0 40px rgba(160, 82, 45, 0.2), inset 0 0 60px rgba(139, 69, 19, 0.1)' }}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-2">{trip.title}</h3>
          <div className="flex items-center gap-2">
            <PublicAccessBadge accessLevel={accessLevel} size="sm" />
          </div>
        </div>

        {trip.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trip.description}</p>}

        {/* Social Stats（いいね・コメント・シェア） */}
        <div className="mb-3">
          <SocialStats size="sm" showComments={true} />
        </div>

        {/* Clone Trip Plan ボタン（公開Tripのみ） */}
        {accessLevel === 'public' && (
          <div className="mb-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // TODO: Clone Trip Plan の実装
                router.push(`/trip/new?clone=${trip.slug || trip.id}`)
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
            >
              <Icon icon="mdi:content-copy" className="h-4 w-4" />
              <span>Clone Trip Plan</span>
            </button>
          </div>
        )}

        <div className="mb-3 flex items-center gap-2 flex-wrap">
          {trip.destination && (
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <IconRenderer iconName="pin" className="w-4 h-4" color="#6b7280" />
              {trip.destination}
            </p>
          )}
          {/* 国旗表示: destination_place.address_components から国コードを取得 */}
          {trip.destination_place?.address_components && (() => {
            const countryComponent = trip.destination_place.address_components.find(
              (component: any) => component.types.includes('country')
            )
            const countryCode = countryComponent?.short_name
            if (countryCode && countryCode !== 'unknown') {
              return (
                <span className="text-sm">
                  {getCountryFlag(countryCode)}
                </span>
              )
            }
            return null
          })()}
        </div>

        <div className="flex items-center justify-between gap-4">
          {trip.start_date && trip.end_date && (
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <IconRenderer iconName="calendar" className="w-4 h-4" color="#6b7280" />
              {(() => {
                const language = getUserLanguage()
                const { futureTrips, pastTrips } = dateUtils.sortTripsByDate([trip])
                if (futureTrips.length > 0) {
                  return dateUtils.formatFutureTripDate(trip.start_date, trip.end_date, language)
                } else if (pastTrips.length > 0) {
                  return dateUtils.formatPastTripDate(trip.start_date, trip.end_date, language)
                } else {
                  return dateUtils.formatDateRange(trip.start_date, trip.end_date, language)
                }
              })()}
            </p>
          )}
          
          {/* 作成者情報 */}
          {trip.creator?.name && trip.creator?.slug && (
            <button
              type="button"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/${trip.creator!.slug}`)
              }}
            >
              {trip.creator.profile_image_url ? (
                <Image
                  src={trip.creator.profile_image_url}
                  alt={trip.creator.name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <IconRenderer iconName="user" className="w-5 h-5" color="#6b7280" />
              )}
              <span className="text-sm font-medium">{trip.creator.name}</span>
              {/* テンプレートの場合はバッジを表示 */}
              {trip.is_template && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Icon icon="mdi:lightbulb-on-outline" className="h-3 w-3" />
                  <span>プラン作成者</span>
                </span>
              )}
            </button>
          )}
        </div>
      </Card>
    </Link>
  )
}

export default TripCard


