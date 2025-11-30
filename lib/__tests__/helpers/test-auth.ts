/**
 * 認証テストヘルパー
 *
 * テスト用の認証コンテキストやモックユーザーを作成するためのヘルパー関数を提供します。
 */

/**
 * テスト用のモックユーザーデータ
 */
export interface MockUser {
	uid: string;
	email: string;
	displayName: string;
	photoURL?: string;
}

/**
 * テスト用のデフォルトユーザーを作成
 *
 * @param uid ユーザーID（デフォルト: 'test-user-1'）
 * @returns モックユーザーデータ
 */
export function createMockUser(uid: string = "test-user-1"): MockUser {
	return {
		uid,
		email: `${uid}@test.example.com`,
		displayName: `Test User ${uid}`,
		photoURL: `https://example.com/avatar/${uid}.jpg`,
	};
}

/**
 * 複数のモックユーザーを作成
 *
 * @param count 作成するユーザー数
 * @returns モックユーザー配列
 */
export function createMockUsers(count: number): MockUser[] {
	return Array.from({ length: count }, (_, index) =>
		createMockUser(`test-user-${index + 1}`),
	);
}

/**
 * 認証済みリクエストのヘッダーを生成
 *
 * 注意: 実際のAPIテストでは、Firebase AuthのIDトークンをモックする必要があります。
 * この関数はテスト用のモックヘッダーを返します。
 *
 * @param userId ユーザーID
 * @returns 認証ヘッダー（モック）
 */
export function createAuthHeader(userId: string): Record<string, string> {
	// 実際のテストでは、Firebase Auth Admin SDKを使ってトークンを検証します
	// この関数はモック用のヘッダーを返します
	return {
		authorization: `Bearer mock-token-${userId}`,
	};
}

/**
 * 認証なしリクエストのヘッダーを生成
 *
 * @returns 空のヘッダー
 */
export function createUnauthenticatedHeader(): Record<string, string> {
	return {};
}
