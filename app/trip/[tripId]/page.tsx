'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSlugsFromTripId } from '@/lib/travel/slug-helpers'
import logger from '@/lib/core/logger'
import { Spinner } from '@/components/common/Spinner'

type TripIdPageProps = {
  params: {
    tripId: string
  }
}

export default function TripIdPage({ params }: TripIdPageProps) {
  const { tripId } = params
  const router = useRouter()
  const [statusMessage, setStatusMessage] = useState('リダイレクトを準備中です…')

  useEffect(() => {
    let isMounted = true

    const resolveAndRedirect = async () => {
      if (!tripId) {
        setStatusMessage('旅行IDが見つかりませんでした。')
        return
      }

      try {
        setStatusMessage('旅行データを照会しています…')
        const slugs = await getSlugsFromTripId(tripId)

        if (!isMounted) {
          return
        }

        if (slugs) {
          setStatusMessage('新しいURLへ移動します…')
          router.replace(`/${slugs.userSlug}/${slugs.tripSlug}`)
        } else {
          setStatusMessage('旅行が見つかりません。トップページへ戻ります…')
          router.replace('/?ref=legacy-trip-not-found')
        }
      } catch (error) {
        logger.error('Failed to resolve trip slugs from tripId', { tripId, error })

        if (!isMounted) {
          return
        }

        setStatusMessage('旅行データの取得に失敗しました。トップページへ戻ります…')
        router.replace('/?error=trip-resolution-failed')
      }
    }

    resolveAndRedirect()

    return () => {
      isMounted = false
    }
  }, [tripId, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-center px-4">
      <Spinner />
      <p className="text-lg font-medium">{statusMessage}</p>
      <p className="text-sm text-gray-500">
        新しい旅行URLは <code>/ユーザースラッグ/旅行スラッグ</code> 形式になりました。ブックマークの更新をお願いします。
      </p>
    </div>
  )
}

