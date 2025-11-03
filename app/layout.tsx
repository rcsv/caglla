import type { Metadata } from 'next'
import { Inter, Rajdhani } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/auth'
import { SubscriptionProvider } from '@/lib/contexts/subscription'
import { UserDataProvider } from '@/lib/contexts/user-data'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress content-visibility warnings in development
              if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
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
