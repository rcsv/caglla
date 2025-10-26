#!/usr/bin/env ts-node

/**
 * Google Cloud Secret Manager セットアップスクリプト
 * Firebase App Hosting用の環境変数をSecret Managerに登録
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { readFileSync } from 'fs'
import { join } from 'path'

// プロジェクトID
const PROJECT_ID = 'caglla-fb'

// 必要な環境変数のリスト
const REQUIRED_SECRETS = [
  // Firebase Configuration (クライアント側)
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  
  // Firebase Admin SDK Configuration (サーバー側)
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  
  // Google APIs Configuration
  'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'NEXT_PUBLIC_GOOGLE_MAP_ID',
  
  // App URL
  'NEXT_PUBLIC_APP_URL',
  
  // Optional APIs
  'NEXT_PUBLIC_UNSPLASH_APP_ID',
  'NEXT_PUBLIC_UNSPLASH_ACCESS_KEY',
  'UNSPLASH_SECRET_KEY',
  
  // External APIs
  'TRIPADVISOR_API_KEY',
  'FOURSQUARE_API_KEY',
  'SELECTPDF_API_KEY',
  
  // SendGrid Configuration
  'SENDGRID_API_KEY',
]

async function setupSecrets() {
  console.log('🔐 Google Cloud Secret Manager セットアップを開始...')
  
  // Secret Manager クライアントを初期化
  const client = new SecretManagerServiceClient()
  
  // .env.localファイルから環境変数を読み込み
  const envPath = join(process.cwd(), '.env.local')
  let envVars: Record<string, string> = {}
  
  try {
    const envContent = readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })
    console.log('✅ .env.localファイルを読み込みました')
  } catch (error) {
    console.error('❌ .env.localファイルが見つかりません:', error)
    console.log('💡 ヒント: .env.localファイルを作成して環境変数を設定してください')
    return
  }
  
  // 各シークレットを作成
  for (const secretName of REQUIRED_SECRETS) {
    try {
      const secretValue = envVars[secretName]
      
      if (!secretValue) {
        console.log(`⚠️  ${secretName}: 値が見つかりません（スキップ）`)
        continue
      }
      
      // シークレットが既に存在するかチェック
      const secretPath = `projects/${PROJECT_ID}/secrets/${secretName}`
      
      try {
        await client.getSecret({ name: secretPath })
        console.log(`✅ ${secretName}: 既に存在します`)
      } catch (error: any) {
        if (error.code === 5) { // NOT_FOUND
          // シークレットを作成
          await client.createSecret({
            parent: `projects/${PROJECT_ID}`,
            secretId: secretName,
            secret: {
              replication: {
                automatic: {},
              },
            },
          })
          console.log(`✅ ${secretName}: シークレットを作成しました`)
        } else {
          throw error
        }
      }
      
      // シークレットバージョンを追加
      await client.addSecretVersion({
        parent: secretPath,
        payload: {
          data: Buffer.from(secretValue, 'utf8'),
        },
      })
      console.log(`✅ ${secretName}: バージョンを追加しました`)
      
    } catch (error) {
      console.error(`❌ ${secretName}: エラーが発生しました:`, error)
    }
  }
  
  console.log('\n🎉 Secret Manager セットアップが完了しました！')
  console.log('\n📋 次のステップ:')
  console.log('1. Google Cloud ConsoleでFirebase App Hostingサービスアカウントに権限を付与')
  console.log('2. firebase apphosting:secrets:set コマンドでアクセス権を設定')
  console.log('3. Firebase App Hostingにデプロイ')
}

// スクリプト実行
if (require.main === module) {
  setupSecrets().catch(console.error)
}

export { setupSecrets }
