/**
 * Trip画像関連のユーティリティ関数
 */

import type { Trip } from "@/lib/core/types";

/**
 * Tripのカバー画像URLを取得
 * @param trip - Tripオブジェクト
 * @param index - 配列内のインデックス
 * @param pool - フォールバック用の画像IDプール
 * @param size - 画像サイズ（デフォルト: 800）
 * @returns カバー画像URL
 */
export function assignCoverImage(
	trip: Trip,
	index: number,
	pool: readonly string[],
	size = 800,
): string {
	if (trip.image_url) {
		return trip.image_url;
	}
	const id = pool[index % pool.length];
	return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${size}&q=70`;
}

