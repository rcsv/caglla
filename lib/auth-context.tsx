'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth'
import { auth } from './firebase'
import { getBrowserInfo } from './browser-info'
import { makeAuthenticatedRequest } from './api-helpers'

import type { AuthContextType } from './types'

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)
      
      // ユーザーがログインした場合、ユーザー情報を作成/更新
      if (user) {
        await createOrUpdateUser(user)
      }
    })

    return () => unsubscribe()
  }, [])

  const createOrUpdateUser = async (firebaseUser: User) => {
    try {
      // ブラウザ情報を取得
      const browserInfo = await getBrowserInfo()
      
      // ユーザーの基本情報（name/email/icon）はサーバ側で保持するため、
      // ここでは preferences のみ同期して上書きを避ける
      const userData = {
        preferences: {
          currency: browserInfo.currency,
          timezone: browserInfo.timezone,
          language: browserInfo.language,
          home_address: browserInfo.homeAddress,
          theme: 'light' as const,
          notifications: true
        }
      }
      
      // APIを呼び出してユーザーを作成/更新
      await makeAuthenticatedRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      })
    } catch (error) {
      console.error('Error creating/updating user:', error)
    }
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
