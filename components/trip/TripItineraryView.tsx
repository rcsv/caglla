'use client'

import { Trip, Day, Itinerary } from '@/lib/firestore'
import DayEditor from '@/components/trip/DayEditor'
import SortableItineraryCard from '@/components/trip/SortableItineraryCard'
import VenueDistance from '@/components/trip/VenueDistance'
import VenueInsertButton from '@/components/trip/VenueInsertButton'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface TripItineraryViewProps {
  trip: Trip
  collapsedDays: Set<string>
  selectedDayId: string | null
  selectedItineraryId: string | null
  onToggleDayCollapse: (dayId: string) => void
  onDayClick: (dayId: string) => void
  onAddSchedule: (dayId: string) => void
  onInsertSchedule: (dayId: string, afterIndex: number) => void
  onAddDay: () => void
  onScheduleUpdated: (updatedItinerary: any) => void
  onMoveUp: (itineraryId: string, dayId: string) => void
  onMoveDown: (itineraryId: string, dayId: string) => void
  onMoveToDay: (itineraryId: string, targetDayId: string) => void
  onDuplicateToDay: (itineraryId: string, targetDayId: string) => void
  onScheduleDelete: (itineraryId: string) => void
  onItineraryClick: (itineraryId: string) => void
  onDragEnd: (event: DragEndEvent) => void
  onUpdateTrip: (updatedTrip: Trip) => void
  expandAllDays: () => void
  collapseAllDays: () => void
}

export default function TripItineraryView({
  trip,
  collapsedDays,
  selectedDayId,
  selectedItineraryId,
  onToggleDayCollapse,
  onDayClick,
  onAddSchedule,
  onInsertSchedule,
  onAddDay,
  onScheduleUpdated,
  onMoveUp,
  onMoveDown,
  onMoveToDay,
  onDuplicateToDay,
  onScheduleDelete,
  onItineraryClick,
  onDragEnd,
  onUpdateTrip,
  expandAllDays,
  collapseAllDays,
}: TripItineraryViewProps) {
  // itinerariesのタイトルを生成する関数
  const generateItinerarySummary = (day: Day): string => {
    if (!day.itineraries || day.itineraries.length === 0) {
      return ''
    }
    
    const sortedItineraries = [...day.itineraries].sort((a, b) => a.sort_number - b.sort_number)
    return sortedItineraries.map(itinerary => itinerary.title).join(' → ')
  }

  return (
    <main className="px-4 pb-4">
      {/* Days */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">日程</h2>
          {trip.days && trip.days.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={expandAllDays}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                全て展開
              </button>
              <button
                onClick={collapseAllDays}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                全て折りたたみ
              </button>
            </div>
          )}
        </div>
        
        {/* Day Cards - 常に表示 */}
        {trip.days && trip.days.length > 0 ? (
          trip.days.map((day) => {
            const isCollapsed = collapsedDays.has(day.id)
            const itinerarySummary = generateItinerarySummary(day)

            return (
              <div
                key={day.id}
                id={`day-${day.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                {/* ヘッダー部分 - 常に表示 */}
                <div 
                  className={`flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors ${selectedDayId === day.id ? 'bg-red-50 border-red-200' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDayClick(day.id)
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{day.day_number} | {trip.start_date 
                          ? (() => {
                              const dayDate = new Date(trip.start_date)
                              dayDate.setDate(dayDate.getDate() + (day.day_number - 1))
                              const month = dayDate.getMonth() + 1
                              const dayNum = dayDate.getDate()
                              const dayNames = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
                              const dayName = dayNames[dayDate.getDay()]
                              return `${month}/${dayNum} ${dayName}`
                            })()
                          : '日付が設定されていません'
                        }
                      </h3>
                      {/* 折りたたみアイコン */}
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {/* 縮小表示時の情報 */}
                    {isCollapsed && (
                      <div className="text-sm text-gray-600">
                        {day.description && (
                          <p className="mb-1">{day.description}</p>
                        )}
                        {itinerarySummary && (
                          <p className="text-gray-500">{itinerarySummary}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 詳細部分 - 折りたたまれていない時のみ表示 */}
                {!isCollapsed && (
                  <div className="px-6 pb-6">
                    <DayEditor 
                      day={day as any} 
                      itinerarySummary={itinerarySummary}
                      onUpdate={(updatedDay: any) => {
                        onUpdateTrip({
                          ...trip,
                          days: trip.days?.map(d => 
                            d.id === updatedDay.id ? updatedDay as any : d
                          ) || []
                        })
                      }} 
                    />

                    {day.itineraries && day.itineraries.length > 0 ? (
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-900">スケジュール</h4>
                          <button
                            onClick={() => onAddSchedule(day.id)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Venue / Point of Interest を追加
                          </button>
                        </div>
                        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                          <SortableContext 
                            items={day.itineraries.map(i => i.id)} 
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-0">
                              {day.itineraries.map((itinerary, index) => {
                                const previousItinerary = index > 0 ? day.itineraries?.[index - 1] : null
                                const nextItinerary = index < (day.itineraries?.length || 0) - 1 ? day.itineraries?.[index + 1] : null
                                
                                return (
                                  <div key={itinerary.id} className="relative">
                                    <SortableItineraryCard
                                      itinerary={itinerary}
                                      previousPlace={previousItinerary?.place_data}
                                      nextPlace={nextItinerary?.place_data}
                                      onUpdate={onScheduleUpdated}
                                      onMoveUp={() => onMoveUp(itinerary.id, day.id)}
                                      onMoveDown={() => onMoveDown(itinerary.id, day.id)}
                                      onMoveToDay={onMoveToDay}
                                      onDuplicateToDay={onDuplicateToDay}
                                      onDelete={onScheduleDelete}
                                      onItineraryClick={onItineraryClick}
                                      isSelected={selectedItineraryId === itinerary.id}
                                      isFirst={index === 0}
                                      isLast={index === (day.itineraries?.length || 0) - 1}
                                      availableDays={trip.days?.map(d => ({
                                        id: d.id,
                                        day_number: d.day_number,
                                        date: '' // Day型にdateプロパティがないため空文字列を設定
                                      })) || []}
                                    />
                                    
                                    {/* 次のVenueへの距離表示（最後のカード以外、かつ両方にplace_dataがある場合のみ） */}
                                    {itinerary.place_data && 
                                     nextItinerary?.place_data && 
                                     itinerary.place_data.place_id !== nextItinerary.place_data.place_id && (
                                      <VenueDistance 
                                        fromPlace={itinerary.place_data}
                                        toPlace={nextItinerary.place_data}
                                        mode="driving"
                                        showInsertButton={true}
                                        onInsertVenue={() => onInsertSchedule(day.id, index)}
                                      />
                                    )}
                                    
                                    {/* Venue間の挿入ボタン（距離表示がない場合のみ） */}
                                    {index < (day.itineraries?.length || 0) - 1 && 
                                     (!itinerary.place_data || !nextItinerary?.place_data || 
                                      itinerary.place_data.place_id === nextItinerary.place_data.place_id) && (
                                      <VenueInsertButton
                                        onInsert={() => onInsertSchedule(day.id, index)}
                                        dayId={day.id}
                                      />
                                    )}
                                  </div>
                                )
                              })}
                              
                              {/* 最後のVenueの後に挿入ボタンを表示 */}
                              {day.itineraries.length > 0 && (
                                <div className="flex justify-center py-4">
                                  <div className="relative flex items-center justify-center">
                                    {/* Gitタイムライン風の縦線（上側のみ） */}
                                    <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gray-300 top-0"></div>
                                    
                                    {/* 挿入ボタン */}
                                    <button
                                      onClick={() => onInsertSchedule(day.id, (day.itineraries?.length || 0) - 1)}
                                      className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
                                      title="最後にVenueを追加"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12S21.1 14 20 14H14V20C14 21.1 13.1 22 12 22S10 21.1 10 20V14H4C2.9 14 2 13.1 2 12S2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" />
                                        <path 
                                          d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z" 
                                          fill="white"
                                          opacity="0.8"
                                          transform="scale(0.3) translate(20, 20)"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>まだスケジュールがありません</p>
                        <button
                          onClick={() => onAddSchedule(day.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Venue / Point of Interest を追加
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          // 日程が0件の場合でも空のDayカードを表示
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-gray-600 mb-4">日程を追加して旅行を計画しましょう</p>
          </div>
        )}
        
        {/* 日程追加ボタン - 常に表示 */}
        <div className="mt-6 text-center">
          <button
            onClick={onAddDay}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            日程を追加
          </button>
        </div>
      </div>
    </main>
  )
}
