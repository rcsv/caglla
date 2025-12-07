/**
 * Tripのアクセスレベル関連のユーティリティ
 */

export type AccessLevel = "public" | "unlisted" | "draft";

interface AccessLevelInfo {
	label: string;
	color: string;
}

const ACCESS_LEVEL_MAP: Record<AccessLevel, AccessLevelInfo> = {
	public: {
		label: "Public",
		color: "text-green-600 bg-green-50 border-green-200",
	},
	unlisted: {
		label: "Shared link",
		color: "text-blue-600 bg-blue-50 border-blue-200",
	},
	draft: {
		label: "Draft",
		color: "text-gray-600 bg-gray-50 border-gray-200",
	},
} as const;

/**
 * アクセスレベルからラベルと色を取得
 * @param level - アクセスレベル（undefinedの場合はdraftとして扱う）
 * @returns ラベルと色の情報
 */
export function getAccessLevelInfo(
	level?: string,
): AccessLevelInfo {
	const normalizedLevel = (level as AccessLevel) || "draft";
	return (
		ACCESS_LEVEL_MAP[normalizedLevel] ?? ACCESS_LEVEL_MAP.draft
	);
}

