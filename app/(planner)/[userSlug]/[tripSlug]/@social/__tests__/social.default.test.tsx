'use client'

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SocialDefault from '../default'

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useParams: () => ({ userSlug: 'alice', tripSlug: 'tokyo-2025' })
}))

jest.mock('@/lib/contexts/auth', () => ({
  useAuth: () => ({ user: { uid: 'u1', getIdToken: async () => 'token' } })
}))

jest.mock('@/lib/api/helpers', () => ({
  makeAuthenticatedRequest: jest.fn(async (url: string) => {
    if (url.endsWith('/likes')) {
      return { ok: true, json: async () => ({ likesCount: 5, likedByMe: true }) } as any
    }
    if (url.includes('/api/trip/')) {
      return {
        ok: true,
        json: async () => ({
          id: 'trip1',
          title: 'Tokyo Trip',
          access_level: 'public',
          social_stats: { likes_count: 5, comments_count: 2 },
        }),
      } as any
    }
    return { ok: true, json: async () => ({}) } as any
  }),
}))

describe('@social default', () => {
  it('renders LikeButton and CommentList after fetching trip and like state', async () => {
    render(<SocialDefault />)
    await waitFor(() => {
      // いいねボタンのカウント（5）がどこかに反映されていることを軽く検証
      expect(screen.getByText(/5/)).toBeInTheDocument()
    })
    // コメントリストのコンテナ（見出しやセクション）相当が描画されることを緩く確認
    // 具体テキストに依存しないため、存在検証に留める
    expect(document.querySelector('.p-4')).toBeTruthy()
  })
})


