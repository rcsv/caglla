'use strict'

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MapDefault from '../default'

// Minimal Google Maps stub
// @ts-ignore
global.window.google = {
  maps: {
    Map: function () { return {} },
    Marker: function () {},
    Point: function () {},
    Animation: { DROP: 1 },
    DirectionsService: function () {},
    DirectionsRenderer: function () {},
    event: { addListener: () => {} },
  }
}

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
          destination_place: undefined,
          days: [
            {
              id: 'day1',
              day_number: 1,
              itineraries: [
                { id: 'it1', title: 'Senso-ji', sort_number: 1, place_data: null },
              ],
            },
          ],
        }),
      } as any
    }
    return { ok: true, json: async () => ({}) } as any
  }),
}))

describe('@map default (read-only)', () => {
  it('renders TripMap container after fetching trip', async () => {
    // Provide required env vars to silence validation warnings in tests
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-key'
    render(<MapDefault />)
    // 地図コンテナが存在すること（Loading表示の有無は実装に依存するため不問）
    await waitFor(() => {
      const container = document.querySelector('.h-full')
      expect(container).toBeTruthy()
    })
  })
})


