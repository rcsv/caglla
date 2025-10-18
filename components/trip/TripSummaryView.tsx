'use client'

import { Trip, Itinerary } from '@/lib/core/types'
import TripDistanceDisplay from '@/components/stats/TripDistanceDisplay'
import TripWeatherDisplay from '@/components/stats/TripWeatherDisplay'
import TripCostDisplay from '@/components/stats/TripCostDisplay'
import TripHotelDisplay from '@/components/stats/TripHotelDisplay'
import TripReservationDisplay from '@/components/stats/TripReservationDisplay'
import ActivityStatsDisplay from '@/components/stats/ActivityStatsDisplay'
import { SummaryIcon } from '@/components/common/icons/SummaryIcon'
import { dateUtils } from '@/lib/utils/date'

interface TripSummaryViewProps {
  trip: Trip
  summaryCollapsed: boolean
  onToggleSummary: () => void
  getAllItineraries: () => Itinerary[]
}

export default function TripSummaryView({
  trip,
  summaryCollapsed,
  onToggleSummary,
  getAllItineraries,
}: TripSummaryViewProps) {
  return (
    <div className="px-4 py-4 space-y-6">
      {/* Summary Header - 折りたたみ可能 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div 
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onToggleSummary}
        >
          <div className="flex items-center gap-2">
            <SummaryIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-800">Summary</h2>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${summaryCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Summary Content - 折りたたまれていない時のみ表示 */}
        {!summaryCollapsed && (
          <div className="px-4 pb-4 space-y-6">
            {/* Trip Description - SummaryとAt a glanceの間に配置 */}
            {trip.description && (
              <div id="trip-description">
                <p className="text-gray-700 whitespace-pre-line">{trip.description}</p>
              </div>
            )}

            {/* 1. Weather Forecast - 旅行直前に最も確認する情報 */}
            <div id="weather-forecast" className="anchor-offset">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Weather Forecast</h3>
              <TripWeatherDisplay 
                destination={trip.destination}
                startDate={trip.start_date ? dateUtils.toUrlDateString(trip.start_date) : undefined}
                endDate={trip.end_date ? dateUtils.toUrlDateString(trip.end_date) : undefined}
              />
            </div>

            {/* 2. Reservations - 予約情報の確認 */}
            <div id="reservations" className="anchor-offset">
              <TripReservationDisplay itineraries={getAllItineraries()} />
            </div>

            {/* 3. Budget - 旅行費用の管理 */}
            <div id="budget" className="anchor-offset">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Budget</h3>
              <TripCostDisplay itineraries={getAllItineraries()} />
            </div>

            {/* 4. Activity Statistics - アクティビティタグの統計 */}
            <div id="activity-statistics" className="anchor-offset">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Activity Statistics</h3>
              <ActivityStatsDisplay trip={trip} />
            </div>

            {/* 5. Distances - 総移動距離（統計・振り返り用） */}
            <div id="distance-summary" className="anchor-offset">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Distances</h3>
              <TripDistanceDisplay itineraries={getAllItineraries()} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
