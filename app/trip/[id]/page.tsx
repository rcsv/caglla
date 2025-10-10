'use client'
import logger from '@/lib/logger'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getSlugsFromTripId } from '@/lib/slug-data-helpers'
import Loading from '@/components/common/Loading'

export default function TripRedirectPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    const redirectToSlugBasedUrl = async () => {
      if (!id) {
        router.push('/404')
        return
      }

      try {
        // tripId から userSlug と tripSlug を取得
        const slugs = await getSlugsFromTripId(id)
        
        if (!slugs) {
          // スラッグが存在しない場合は404を返す
          router.push('/404')
          return
        }
        
        // 新しいスラッグベースのURLにリダイレクト
        const newUrl = `/${slugs.userSlug}/${slugs.tripSlug}`
        router.replace(newUrl)
    } catch (error) {
        logger.error('Redirect error:', error)
        router.push('/404')
      }
    }

    redirectToSlugBasedUrl()
  }, [id, router])

  // リダイレクト中はローディングを表示
  return <Loading />
}