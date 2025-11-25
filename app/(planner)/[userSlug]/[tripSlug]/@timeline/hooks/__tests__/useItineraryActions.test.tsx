import { act, renderHook } from '@testing-library/react'
import type { Trip } from '@/lib/core/types'
import useItineraryActions from '../useItineraryActions'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { dispatchPOIOpen } from '../../../poi-events'

jest.mock('@/lib/api/helpers', () => ({
  makeAuthenticatedRequest: jest.fn(),
}))

jest.mock('../../../poi-events', () => ({
  dispatchPOIOpen: jest.fn(),
}))

jest.mock('@/lib/core/logger', () => ({
  error: jest.fn(),
}))

describe('useItineraryActions', () => {
  const baseTrip: Trip = {
    id: 'trip-1',
    slug: 'trip-slug',
    title: 'Sample',
    user_id: 'user-1',
    access_level: 'public',
    status: 'PLANNING',
    days: [
      {
        id: 'day-1',
        day_number: 1,
        itineraries: [
          { id: 'it-1', sort_number: 1, title: 'Breakfast' },
          { id: 'it-2', sort_number: 2, title: 'Lunch' },
        ],
      },
    ],
  } as Trip

  const setup = () => {
    let latestTrip: Trip | null = null
    const updateTrip = jest.fn((updater: any) => {
      latestTrip = typeof updater === 'function' ? updater(baseTrip) : updater
    })
    const refreshTrip = jest.fn()
    const setSelectedDayId = jest.fn()
    const setSelectedItineraryId = jest.fn()
    const updateQuery = jest.fn()

    const hook = renderHook(() =>
      useItineraryActions({
        trip: baseTrip,
        updateTrip,
        refreshTrip,
        setSelectedDayId,
        setSelectedItineraryId,
        updateQuery,
      })
    )

    return { result: hook.result, updateTrip, refreshTrip, setSelectedItineraryId, updateQuery, getLatestTrip: () => latestTrip }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles schedule addition and selects the itinerary', () => {
    const { result, getLatestTrip, setSelectedItineraryId, updateQuery } = setup()

    const newItinerary = {
      id: 'it-3',
      day_id: 'day-1',
      title: 'Dinner',
      sort_number: 2,
      place_data: {
        place_id: 'place-1',
        geometry: { location: { lat: 1, lng: 2 } },
      },
    }

    act(() => {
      result.current.handleScheduleAdded(newItinerary as any)
    })

    const updated = getLatestTrip()
    expect(updated?.days?.[0].itineraries?.map(it => it.id)).toEqual(['it-1', 'it-3', 'it-2'])
    expect(setSelectedItineraryId).toHaveBeenCalledWith('it-3')
    expect(updateQuery).toHaveBeenCalledWith({ si: 'it-3', mf: 'single' })
    expect(dispatchPOIOpen).toHaveBeenCalledWith(
      expect.objectContaining({ placeId: 'place-1', name: 'Dinner' })
    )
  })

  it('sends reorder request when moving up', async () => {
    ;(makeAuthenticatedRequest as jest.Mock).mockResolvedValue({ ok: true })
    const { result, getLatestTrip } = setup()

    await act(async () => {
      await result.current.handleMoveUp('it-2', 'day-1')
    })

    expect(makeAuthenticatedRequest).toHaveBeenCalledWith(
      '/api/itineraries/reorder',
      expect.objectContaining({ method: 'POST' })
    )
    expect(getLatestTrip()?.days?.[0].itineraries?.map(it => it.id)).toEqual(['it-2', 'it-1'])
  })

  it('deletes itinerary and refreshes trip', async () => {
    ;(makeAuthenticatedRequest as jest.Mock).mockResolvedValue({ ok: true })
    const { result, refreshTrip, getLatestTrip } = setup()

    await act(async () => {
      await result.current.handleScheduleDelete('it-1')
    })

    expect(makeAuthenticatedRequest).toHaveBeenCalledWith(
      '/api/itineraries/it-1',
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(refreshTrip).toHaveBeenCalled()
    expect(getLatestTrip()?.days?.[0].itineraries?.map(it => it.id)).toEqual(['it-2'])
  })
})
