'use client'

import { Trip, Itinerary } from '@/lib/core/types'
import TripDistanceDisplay from '@/components/stats/TripDistanceDisplay'
import TripWeatherDisplay from '@/components/stats/TripWeatherDisplay'
import TripCostDisplay from '@/components/stats/TripCostDisplay'
import TripHotelDisplay from '@/components/stats/TripHotelDisplay'
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

            {/* At a glance - 総移動距離と天気予報 */}
            <div id="at-a-glance">
              <h3 className="text-lg font-medium text-gray-700 mb-4">At a glance</h3>
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                {/* Distance Summary - 6/10 (60%) */}
                <div className="lg:col-span-6">
                  <TripDistanceDisplay itineraries={getAllItineraries()} />
                </div>
                
                {/* Weather Summary - 4/10 (40%) */}
                <div className="lg:col-span-4">
                  <TripWeatherDisplay 
                    destination={trip.destination}
                    startDate={trip.start_date ? dateUtils.toUrlDateString(trip.start_date) : undefined}
                    endDate={trip.end_date ? dateUtils.toUrlDateString(trip.end_date) : undefined}
                  />
                </div>
              </div>
            </div>

            {/* Activity Statistics - アクティビティタグの統計 */}
            <div id="activity-statistics">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Activity Statistics</h3>
              <ActivityStatsDisplay trip={trip} />
            </div>

            {/* Budget / Reservation - 旅行費用とホテル情報 */}
            <div id="budget-reservation">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Budget / Reservation</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Cost Summary */}
                <TripCostDisplay itineraries={getAllItineraries()} />
                
                {/* Hotel Summary */}
                <TripHotelDisplay />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
