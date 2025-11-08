import type { Metadata } from 'next'
import { Inter, Rajdhani } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/auth'
import { SubscriptionProvider } from '@/lib/contexts/subscription'
import { UserDataProvider } from '@/lib/contexts/user-data'
import { isSupportedLanguage, type SupportedLanguage } from '@/lib/utils/language'

const inter = Inter({ subsets: ['latin'] })
const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
})

export const metadata: Metadata = {
  title: 'Caglla - Travel Manager',
  description: 'Personal travel itinerary management app',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cookieから言語設定を取得（サーバーサイド）
  const cookieStore = await cookies()
  const languageCookie = cookieStore.get('language')?.value || ''
  
  // サポート言語のみ許可、デフォルトは'en'
  const lang: SupportedLanguage = isSupportedLanguage(languageCookie) 
    ? languageCookie 
    : 'en'
  
  return (
    <html lang={lang}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress content-visibility warnings in development
              if (typeof window !== 'undefined' && typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                  if (args[0] && args[0].includes && args[0].includes('Rendering was performed in a subtree hidden by content-visibility')) {
                    return; // Suppress this specific warning
                  }
                  originalWarn.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${rajdhani.variable}`}>
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
