'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/common/Card'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import PublicAccessBadge from '@/components/common/icons/PublicAccessBadge'
import { dateUtils } from '@/lib/utils/date'
import { getCountryFlag } from '@/lib/utils/country-flags'
import { getUserLanguage } from '@/lib/utils/language'
import type { Trip } from '@/lib/core/types'

type TripCardVariant = 'standard' | 'imageFull' | 'horizontal'

export interface TripCardProps {
  trip: Trip
  isPastTrip?: boolean
  variant?: TripCardVariant
  priority?: boolean // LCP画像用のpriority属性
}

export const TripCard: React.FC<TripCardProps> = ({ trip, isPastTrip = false, variant = 'standard', priority = false }) => {
        // スラッグベースのURLを生成
        const getTripUrl = () => {
          if (trip.creator?.slug && trip.slug) {
            return `/${trip.creator.slug}/${trip.slug}`
          }
          // フォールバック: スラッグが存在しない場合はIDベースのURL
          return `/trip/${trip.id}`
        }

  // access_levelの型安全性を確保
  const accessLevel = trip.access_level === 'public' || trip.access_level === 'private' 
    ? trip.access_level 
    : 'private'

  // 横長バリアント（Recommended trips用）
  if (variant === 'horizontal') {
    return (
      <Link href={getTripUrl()} className="block group">
        <div className="relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition bg-gray-900 h-32 md:h-40">
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
          
          {/* Content */}
          <div className="relative h-full p-4 md:p-6 flex flex-col justify-between text-white">
            <h3 className="text-lg md:text-xl font-bold drop-shadow-md line-clamp-2">
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
              {trip.creator?.name && (
                <span className="flex items-center gap-1">
                  <IconRenderer iconName="user" className="w-3 h-3" color="white" />
                  {trip.creator.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'imageFull') {
    return (
      <Link href={getTripUrl()} className="block group">
        <div className="relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition bg-gray-900 h-[28rem]">
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
          </div>
        </div>
      </Link>
    )
  }

  // standard
  return (
    <Link href={getTripUrl()} className="block group">
      <Card interactive padding="md" className="h-full">
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
          <PublicAccessBadge accessLevel={accessLevel} size="sm" />
        </div>

        {trip.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trip.description}</p>}

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
      </Card>
    </Link>
  )
}

export default TripCard


