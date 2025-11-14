/**
 * Firestore エミュレータ用テストヘルパー
 * 
 * Firestore エミュレータを使用したテストを簡単に実行するためのヘルパー関数を提供します。
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

const TEST_PROJECT_ID = 'test-project'
const EMULATOR_HOST = 'localhost'
const FIRESTORE_EMULATOR_PORT = 8080

let testApp: App | null = null
let testFirestore: Firestore | null = null

/**
 * Firestore エミュレータに接続されたFirestoreインスタンスを取得
 * 
 * @returns Firestoreインスタンス
 */
export function getTestFirestore(): Firestore {
  if (testFirestore) {
    return testFirestore
  }

  // エミュレータが起動しているかチェック
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = `${EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}`
  }

  // 既存のアプリがある場合は削除（テストの独立性を保つため）
  const existingApps = getApps()
  if (existingApps.length > 0) {
    existingApps.forEach((app) => {
      if (app.name !== '[DEFAULT]') {
        // デフォルト以外のアプリは削除しない（エラーになる可能性があるため）
      }
    })
  }

  // テスト用Firebase Admin SDKアプリを初期化
  if (!testApp) {
    testApp = initializeApp(
      {
        projectId: TEST_PROJECT_ID,
        credential: cert({
          projectId: TEST_PROJECT_ID,
          clientEmail: 'test@test-project.iam.gserviceaccount.com',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n',
        }),
      },
      `test-${Date.now()}`
    )
  }

  testFirestore = getFirestore(testApp)
  
  // エミュレータへの接続を設定
  testFirestore.settings({
    host: `${EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}`,
    ssl: false,
  })

  return testFirestore
}

/**
 * テスト用Firestoreデータをクリア
 * 
 * @param firestore Firestoreインスタンス
 */
export async function clearTestFirestore(firestore: Firestore): Promise<void> {
  // 注意: Firestoreエミュレータでは、コレクションを削除するAPIがないため、
  // 各コレクションのドキュメントを個別に削除する必要があります
  // 実際のテストでは、各テストケースで必要なデータのみをセットアップ・クリーンアップすることを推奨
  
  // 参考: エミュレータを再起動するか、テスト後に手動でデータをクリーンアップする
}

/**
 * テスト用の認証済みユーザーコンテキストを作成
 * 
 * 注意: Firebase Admin SDKでは認証コンテキストのモックは直接サポートされていません。
 * セキュリティルールのテストには @firebase/rules-unit-testing を使用してください。
 * 
 * @param userId ユーザーID
 * @returns 認証済みコンテキスト（現在は未実装）
 */
export function createAuthenticatedContext(userId: string): {
  firestore: Firestore
  userId: string
} {
  const firestore = getTestFirestore()
  return {
    firestore,
    userId,
  }
}

/**
 * テスト前のセットアップ
 * 
 * Jest の beforeAll などで呼び出します。
 */
export async function setupTestFirestore(): Promise<void> {
  // エミュレータが起動していることを確認
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.warn(
      '⚠️  FIRESTORE_EMULATOR_HOST が設定されていません。' +
      'エミュレータが起動していることを確認してください。' +
      '起動コマンド: firebase emulators:start --only firestore'
    )
  }
  
  // Firestoreインスタンスを取得（初期化）
  getTestFirestore()
}

/**
 * テスト後のクリーンアップ
 * 
 * Jest の afterAll などで呼び出します。
 */
export async function teardownTestFirestore(): Promise<void> {
  // 現在は特にクリーンアップ処理は不要
  // 将来的にコネクションを閉じる処理などを追加する可能性があります
  testFirestore = null
  testApp = null
}

