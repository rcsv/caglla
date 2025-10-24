/**
 * APP_URL管理ユーティリティ
 * 環境に応じたアプリケーションURLの自動決定と管理
 */

/**
 * 環境に応じたAPP_URLを取得
 * 優先順位: 環境変数 > 自動判定
 */
export function getAppUrl(): string {
  // 環境変数が明示的に設定されている場合はそれを使用
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  return getAppUrlByEnvironment()
}

/**
 * 環境に応じたAPP_URLを自動決定
 */
function getAppUrlByEnvironment(): string {
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

/**
 * トリップURLを生成
 */
export function generateTripUrl(userSlug: string, tripSlug: string): string {
  const baseUrl = getAppUrl()
  return `${baseUrl}/${userSlug}/${tripSlug}`
}

/**
 * 現在の環境情報を取得（デバッグ用）
 */
export function getEnvironmentInfo(): {
  nodeEnv: string
  appUrl: string
  vercelUrl?: string
  firebaseAppHostingUrl?: string
  explicitAppUrl?: string
} {
  return {
    nodeEnv: process.env.NODE_ENV || 'unknown',
    appUrl: getAppUrl(),
    vercelUrl: process.env.VERCEL_URL,
    firebaseAppHostingUrl: process.env.FIREBASE_APP_HOSTING_URL,
    explicitAppUrl: process.env.NEXT_PUBLIC_APP_URL
  }
}
