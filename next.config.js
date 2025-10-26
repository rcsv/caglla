/**
 * 環境に応じたAPP_URLを自動決定する関数
 */
function getAppUrlByEnvironment() {
  const nodeEnv = process.env.NODE_ENV
  const vercelUrl = process.env.VERCEL_URL
  const firebaseAppHostingUrl = process.env.FIREBASE_APP_HOSTING_URL
  
  // 本番環境での自動判定
  if (nodeEnv === 'production') {
    // Firebase App Hosting
    if (firebaseAppHostingUrl) {
      return `https://${firebaseAppHostingUrl}`
    }
    // Vercel
    if (vercelUrl) {
      return `https://${vercelUrl}`
    }
    // デフォルトの本番URL
    return 'https://caglla--caglla-fb.asia-east1.hosted.app'
  }
  
  // 開発環境
  if (nodeEnv === 'development') {
    return 'http://localhost:3000'
  }
  
  // その他の環境（テストなど）
  return 'http://localhost:3000'
}

/** @type {import('next').NextConfig} */
const nextConfig = {

  // allowed Dev origin
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: [
    'localhost',
    'elodia-protomorphic-gloria.ngrok-free.dev',
    'caglla--caglla-fb.asia-east1.hosted.app',
    'caglla.travel'],

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Firebase App Hosting用の設定
  output: 'standalone',
  
  // 環境変数の明示的な公開（Firebase App Hosting用）
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  async redirects() {
    return []
  },
}

module.exports = nextConfig
