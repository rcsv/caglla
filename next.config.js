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
    'elodia-protomorphic-gloria.ngrok-free.dev'],

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Firebase App Hosting用の設定
  output: 'standalone',
  
  async redirects() {
    return []
  },
}

module.exports = nextConfig
