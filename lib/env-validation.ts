// 環境変数の検証とバリデーション

interface RequiredEnvVars {
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: string
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string
  NEXT_PUBLIC_FIREBASE_APP_ID: string
  
  // Firebase Admin SDK Configuration
  FIREBASE_PROJECT_ID: string
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_PRIVATE_KEY: string
  
  // Google Places API
  NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: string
}

interface OptionalEnvVars {
  NEXT_PUBLIC_GOOGLE_MAP_ID?: string
  DB_HOST?: string
  DB_USER?: string
  DB_PASSWORD?: string
  DB_NAME?: string
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
    'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY'
  ]

  const missingVars: string[] = []
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  // 開発環境では警告のみ、本番環境ではエラー
  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    
    if (isDevelopment()) {
      console.warn('⚠️ Environment validation warning:', message)
      // 開発環境ではデフォルト値を設定
      return {
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dev-api-key',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dev-project.firebaseapp.com',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dev-project',
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dev-project.appspot.com',
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:dev',
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'dev-project',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'dev@dev-project.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\ndev-key\n-----END PRIVATE KEY-----',
        NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || 'dev-places-key',
        ...process.env as OptionalEnvVars
      }
    } else {
      throw new EnvValidationError(message)
    }
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
    console.error('Environment validation failed:', error)
    throw error
  }
}

// クライアントサイドでの環境変数検証（NEXT_PUBLIC_プレフィックスのみ）
export function validateClientEnvironment(): Partial<RequiredEnvVars> {
  const clientVars: (keyof RequiredEnvVars)[] = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY'
  ]

  const missingVars: string[] = []
  
  for (const varName of clientVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  // 開発環境では警告のみ、本番環境ではエラー
  if (missingVars.length > 0) {
    const message = `Missing required client environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all NEXT_PUBLIC_ variables are set.'
    
    if (isDevelopment()) {
      console.warn('⚠️ Client environment validation warning:', message)
      // 開発環境ではデフォルト値を設定
      return {
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dev-api-key',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dev-project.firebaseapp.com',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dev-project',
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dev-project.appspot.com',
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:dev',
        NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || 'dev-places-key'
      }
    } else {
      throw new EnvValidationError(message)
    }
  }

  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!
  }
}
