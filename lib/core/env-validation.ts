// 環境変数の検証とバリデーション

import type { RequiredEnvVars, OptionalEnvVars } from '@/lib/core/types'
import logger from '@/lib/core/logger'

// グローバル型定義の拡張
declare global {
  var __envWarningShown: boolean | undefined
}

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvValidationError'
  }
}

// 開発環境では環境変数の検証を緩和
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// ビルド時かどうかを判定
function isBuildTime(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build'
}

export function validateEnvironment(): RequiredEnvVars & OptionalEnvVars {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'NEXT_PUBLIC_UNSPLASH_ACCESS_KEY'
  ]

  const missingVars: string[] = []
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  // ビルド時は環境変数の検証をスキップ
  if (isBuildTime()) {
    logger.debug('🔧 Build time: Environment variables validation skipped')
    return {
      ...process.env as unknown as RequiredEnvVars & OptionalEnvVars
    }
  }

  // すべての環境でエラーを投げる（開発環境でも厳格に検証）
  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(', ')}\n\n` +
      'Please follow these steps:\n' +
      '1. Copy env.example to .env.local\n' +
      '2. Fill in all required environment variables\n' +
      '3. Restart the development server\n\n' +
      'Refer to the README.md for detailed setup instructions.'
    
    if (isDevelopment()) {
      logger.error('❌ Environment validation failed:', message)
      logger.error('\n📝 Missing variables:', missingVars)
    }
    
    throw new EnvValidationError(message)
  }

  // Firebase Project IDの一貫性チェック（本番環境のみ）
  if (!isDevelopment() && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== process.env.FIREBASE_PROJECT_ID) {
    throw new EnvValidationError(
      'Firebase Project ID mismatch: NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID must be the same'
    )
  }

  return {
    ...process.env as unknown as RequiredEnvVars & OptionalEnvVars
  }
}

// サーバーサイドでの環境変数検証
export function validateServerEnvironment(): RequiredEnvVars & OptionalEnvVars {
  try {
    return validateEnvironment()
  } catch (error) {
    logger.error('Environment validation failed:', error)
    throw error
  }
}

// クライアントサイドでの環境変数検証（NEXT_PUBLIC_プレフィックスのみ）
export function validateClientEnvironment(options: { suppressWarnings?: boolean } = {}): Partial<RequiredEnvVars> {
  const clientVars: (keyof RequiredEnvVars)[] = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'NEXT_PUBLIC_UNSPLASH_ACCESS_KEY'
  ]

  const missingVars: string[] = []
  
  // 環境変数のチェック（デバッグログは抑制）
  for (const varName of clientVars) {
    const value = process.env[varName]
    if (!value) {
      missingVars.push(varName)
    }
  }

  // 開発環境では警告のみ、本番環境ではエラー
  if (missingVars.length > 0) {
    const message = `Missing required client environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all NEXT_PUBLIC_ variables are set.'
    
    if (isDevelopment()) {
      // 警告を抑制するオプションが指定されていない場合のみ警告を表示
      if (!options.suppressWarnings && !global.__envWarningShown) {
        logger.debug('🔧 Development mode: Environment variables validation skipped')
        global.__envWarningShown = true
      }
      
      // 開発環境では警告のみで続行（フォールバック値を使用）
    } else {
      throw new EnvValidationError(message)
    }
  }

  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dev-fallback',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dev-project.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dev-project',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dev-project.appspot.com',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || 'dev-google-places-key',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'dev-google-maps-key',
    NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || 'dev-unsplash-key'
  }
}
