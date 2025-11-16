import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TimelineDefault from '../default'

jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation')
  return {
    ...actual,
    useParams: () => ({ userSlug: 'alice', tripSlug: 'tokyo-2025' }),
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }),
    useSearchParams: () => {
      const params = new URLSearchParams('')
      return {
        get: (key: string) => params.get(key),
        toString: () => params.toString(),
        entries: () => params.entries(),
        forEach: (cb: any) => params.forEach(cb as any),
        keys: () => params.keys(),
        values: () => params.values(),
        has: (key: string) => params.has(key),
      } as any
    },
  }
})

jest.mock('@/lib/api/helpers', () => ({
  makeAuthenticatedRequest: jest.fn(async (url: string) => {
    if (url.includes('/api/trip/')) {
      return {
        ok: true,
        json: async () => ({
          id: 'trip1',
          title: 'Tokyo Trip',
          access_level: 'public',
          days: [
            {
              id: 'day1',
              day_number: 1,
              itineraries: [
                { id: 'it1', title: 'Senso-ji', sort_number: 1 },
                { id: 'it2', title: 'Skytree', sort_number: 2 },
              ],
            },
          ],
        }),
      } as any
    }
    return { ok: true, json: async () => ({}) } as any
  }),
}))

describe('@timeline default (read-only)', () => {
  it('renders TripItineraryView after fetching trip', async () => {
    render(<TimelineDefault />)
    // Loading disappears and itinerary items are rendered
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
    // Expect at least one itinerary title visible
    expect(screen.getByText('Senso-ji')).toBeInTheDocument()
    expect(screen.getByText('Skytree')).toBeInTheDocument()
  })
})


