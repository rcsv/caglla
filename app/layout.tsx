import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { SubscriptionProvider } from '@/lib/subscription-context'
import { UserDataProvider } from '@/lib/user-data-context'

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
