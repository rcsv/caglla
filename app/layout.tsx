import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/auth'
import { SubscriptionProvider } from '@/lib/contexts/subscription'
import { UserDataProvider } from '@/lib/contexts/user-data'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Caglla - Travel Manager',
  description: 'Personal travel itinerary management app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head />
      <body className={inter.className}>
        <AuthProvider>
          <UserDataProvider>
            <SubscriptionProvider>
              {children}
            </SubscriptionProvider>
          </UserDataProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
