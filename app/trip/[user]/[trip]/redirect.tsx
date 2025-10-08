'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TripUserRedirectPage() {
  const router = useRouter()
  const { user, trip } = useParams<{ user: string; trip: string }>()

  useEffect(() => {
    // 新しいURL構造にリダイレクト
    router.replace(`/${user}/${trip}`)
  }, [user, trip, router])

  return null
}
