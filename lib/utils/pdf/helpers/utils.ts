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
