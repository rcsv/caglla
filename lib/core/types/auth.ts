/**
 * 認証関連の型定義
 */

// ============================================================================
// 認証関連
// ============================================================================

/**
 * Auth Context型
 */
export interface AuthContextType {
	user: any | null;
	loading: boolean;
	signInWithGoogle: () => Promise<void>;
	logout: () => Promise<void>;
}
