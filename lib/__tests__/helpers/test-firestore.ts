/**
 * Firestore エミュレータ用テストヘルパー
 * 
 * Firestore エミュレータを使用したテストを簡単に実行するためのヘルパー関数を提供します。
 */

import { initializeApp, getApps, type App } from 'firebase-admin/app'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase-admin/firestore'

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

  // テスト用Firebase Admin SDKアプリを初期化（エミュレータ用）
  if (!testApp) {
    // エミュレータ環境では認証情報は不要
    // 既存のアプリを確認し、なければ新規作成
    const existingApps = getApps()
    if (existingApps.length > 0) {
      // 既存のアプリがある場合は、それを削除せず、名前付きで新規作成
      testApp = initializeApp(
        {
          projectId: TEST_PROJECT_ID,
        },
        `test-${Date.now()}`
      )
    } else {
      testApp = initializeApp({
        projectId: TEST_PROJECT_ID,
      })
    }
  }

  testFirestore = getFirestore(testApp)
  
  // エミュレータへの接続を設定（connectFirestoreEmulatorは使用できないため、settingsで設定）
  // 注意: Admin SDKでは、環境変数 FIRESTORE_EMULATOR_HOST が設定されていれば自動的にエミュレータに接続される
  // 明示的にsettingsで設定する場合：
  try {
    // settings()は既に設定されている場合はエラーになるため、try-catchで囲む
    testFirestore.settings({
      host: `${EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}`,
      ssl: false,
    })
  } catch (error) {
    // 既に設定されている場合は無視
    // @ts-expect-error - settings()のエラーを無視
    if (error.code !== 'already-initialized') {
      throw error
    }
  }

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

