'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'

export default function SRedirectIfAuthenticated() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/home')
    }
  }, [user, loading, router])

  return null
}


