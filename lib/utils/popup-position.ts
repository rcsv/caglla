/**
 * ポップアップの表示位置を計算するユーティリティ
 */

export type PopupPosition = "top" | "bottom";

export interface CalculatePopupPositionOptions {
	buttonElement: HTMLElement | null;
	estimatedPopupHeight: number;
	viewportMargin?: number; // ビューポート端からのマージン（デフォルト: 20px）
}

/**
 * ボタン位置とビューポートに基づいてポップアップの表示位置を計算
 *
 * ボタンの下に十分なスペースがある場合は "bottom"、
 * ない場合は "top" を返す。
 *
 * @param options 計算オプション
 * @returns ポップアップの表示位置（"top" または "bottom"）
 */
export function calculatePopupPosition(
	options: CalculatePopupPositionOptions,
): PopupPosition {
	const {
		buttonElement,
		estimatedPopupHeight,
		viewportMargin = 20,
	} = options;

	if (!buttonElement) return "bottom";

	const buttonRect = buttonElement.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	const buttonBottom = buttonRect.bottom;

	// ボタンの下に十分なスペースがあるかチェック
	if (buttonBottom + estimatedPopupHeight < viewportHeight - viewportMargin) {
		return "bottom";
	} else {
		return "top";
	}
}

