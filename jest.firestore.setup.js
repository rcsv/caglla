/**
 * Firestoreテスト用のJestセットアップファイル
 * 
 * Firebaseの警告ログを抑制します。
 * これらの警告は、セキュリティルールのテストで意図的に拒否される操作によるものです。
 */

// Firebase Firestoreの警告ログを抑制
// 注意: これはセキュリティルールのテストで意図的に拒否される操作による警告です
const originalWarn = console.warn

console.warn = (...args) => {
  // すべての引数を文字列化してチェック
  const message = args
    .map((arg) => {
      if (typeof arg === 'string') return arg
      if (arg && typeof arg.toString === 'function') return arg.toString()
      return String(arg)
    })
    .join(' ')

  // Firebase FirestoreのPERMISSION_DENIED警告をフィルタリング
  if (
    message.includes('GrpcConnection RPC') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('evaluation error') ||
    message.includes('@firebase/firestore') ||
    (message.includes('error. Code: 7 Message: 7') && message.includes('false for'))
  ) {
    // これらの警告はテストで意図的に発生するため、無視します
    return
  }

  // その他の警告は通常通り表示
  originalWarn.apply(console, args)
}

// テスト後に元のconsole.warnを復元
afterAll(() => {
  console.warn = originalWarn
})

