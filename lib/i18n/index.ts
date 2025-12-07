import { getUserLanguage } from "@/lib/utils/language";
import type { SupportedLanguage, User } from "@/lib/core/types";

// 型定義をインポート
import type { TranslationKey, Dictionary } from "./types";

// 言語辞書をインポート
import en from "./en";
import ja from "./ja";

// 型定義を再エクスポート
export type { TranslationKey, Dictionary };

// 全言語の辞書をまとめる（他の言語は英語にフォールバック）
const dictionaries: Record<SupportedLanguage, Dictionary> = {
	en,
	ja,
	zh: en,
	ko: en,
	es: en,
	fr: en,
	de: en,
	it: en,
	pt: en,
};

// グローバルなユーザーデータ参照（クライアント側でのみ使用）
let globalUserData: User | null = null;

/**
 * グローバルなユーザーデータを設定（クライアント側でのみ使用）
 * @param user - ユーザーデータ
 */
export function setGlobalUserData(user: User | null): void {
	if (typeof window !== "undefined") {
		globalUserData = user;
	}
}

/**
 * 翻訳キーから翻訳テキストを取得する関数
 * @param key - 翻訳キー
 * @param variables - 変数置換用のオブジェクト、または言語コード（後方互換性のため）
 * @param lang - 言語コード（variablesがオブジェクトの場合）
 * @returns 翻訳されたテキスト
 */
export function t(
	key: TranslationKey,
	variables?: Record<string, string | number> | SupportedLanguage,
	lang?: SupportedLanguage,
): string {
	// 後方互換性: 2番目の引数がlanguageの場合
	let actualLang: SupportedLanguage;
	let actualVariables: Record<string, string | number> | undefined;

	if (typeof variables === "string") {
		// t(key, 'ja') の形式
		actualLang = variables;
		actualVariables = undefined;
	} else {
		// t(key, { dayCount: 3 }) または t(key, { dayCount: 3 }, 'ja') の形式
		actualVariables = variables;
		if (lang) {
			actualLang = lang;
		} else if (typeof window !== "undefined") {
			// クライアント側では、グローバルなユーザーデータを使用
			actualLang = getUserLanguage(globalUserData);
		} else {
			// サーバー側ではデフォルト
			actualLang = "en";
		}
	}

	const dict = dictionaries[actualLang] || en;
	let translation = dict[key];

	// 変数置換: {{variable}} または {variable} を実際の値に置換
	if (actualVariables) {
		Object.entries(actualVariables).forEach(([varKey, varValue]) => {
			// 二重波括弧 {{variable}} と単一波括弧 {variable} の両方に対応
			// 正規表現でエスケープが必要
			const escapedKey = varKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const doubleBracePattern = `\\{\\{${escapedKey}\\}\\}`;
			const singleBracePattern = `\\{${escapedKey}\\}`;
			
			// まず二重波括弧を置換、次に単一波括弧を置換
			translation = translation.replace(
				new RegExp(doubleBracePattern, "g"),
				String(varValue),
			);
			translation = translation.replace(
				new RegExp(singleBracePattern, "g"),
				String(varValue),
			);
		});
	}

	return translation;
}

/**
 * 指定された言語の辞書を取得する関数
 * @param lang - 言語コード
 * @returns 辞書オブジェクト
 */
export function getDictionary(lang: SupportedLanguage): Dictionary {
	return dictionaries[lang] || en;
}
