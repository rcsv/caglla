import type { Metadata } from 'next'
import { Inter, Rajdhani } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/auth'
import { SubscriptionProvider } from '@/lib/contexts/subscription'
import { UserDataProvider } from '@/lib/contexts/user-data'
import { isSupportedLanguage } from '@/lib/utils/language'
import type { SupportedLanguage } from '@/lib/core/types'

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
              
              // Handle chunk load errors (Parallel Routes対応)
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(event) {
                  if (event.message && event.message.includes('Loading chunk') && event.message.includes('failed')) {
                    console.warn('Chunk load error detected, reloading page...', event.message);
                    // チャンク読み込みエラーの場合はページをリロード
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  }
                });
                
                // Unhandled promise rejectionでもチャンクエラーを検出
                window.addEventListener('unhandledrejection', function(event) {
                  if (event.reason && typeof event.reason === 'object' && event.reason.name === 'ChunkLoadError') {
                    console.warn('ChunkLoadError detected, reloading page...', event.reason);
                    event.preventDefault();
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  }
                });
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
