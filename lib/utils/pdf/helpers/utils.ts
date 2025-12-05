/**
 * PDFテンプレート用の共通ヘルパー関数
 */

/**
 * HTML特殊文字をエスケープ
 */
export function escapeHtml(text: string | undefined | null): string {
	if (!text) return "";

	const map: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#039;",
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 文字列から決定論的なハッシュ値を生成
 * @param text ハッシュ化する文字列
 * @returns ハッシュ値（整数）
 */
function hashString(text: string): number {
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		const char = text.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // 32bit整数に変換
	}
	return Math.abs(hash);
}

/**
 * トリップIDから決定論的に配列インデックスを生成
 * 同じトリップIDに対して常に同じインデックスを返す
 * @param tripId トリップID
 * @param arrayLength 配列の長さ
 * @returns 配列のインデックス（0 から arrayLength - 1）
 */
export function getDeterministicIndex(tripId: string | undefined, arrayLength: number): number {
	if (!tripId || arrayLength === 0) {
		return 0;
	}
	const hash = hashString(tripId);
	return hash % arrayLength;
}

/**
 * QRコードを生成
 */
import QRCode from "qrcode";

export async function generateQRCode(url: string): Promise<string> {
	try {
		const qrDataURL = await QRCode.toDataURL(url, {
			width: 64,
			margin: 1,
			color: {
				dark: "#000000",
				light: "#FFFFFF",
			},
		});
		return qrDataURL;
	} catch (error) {
		console.error("QR code generation failed:", error);
		return "";
	}
}
