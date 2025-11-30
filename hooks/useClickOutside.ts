import { useEffect, RefObject } from "react";

/**
 * 要素外のクリックを検知するカスタムフック
 * @param ref 監視対象の要素のRef
 * @param handler 要素外がクリックされた時のハンドラー
 * @param enabled フックを有効にするかどうか（デフォルト: true）
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
	ref: RefObject<T>,
	handler: (event: MouseEvent) => void,
	enabled: boolean = true,
) {
	useEffect(() => {
		if (!enabled) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				handler(event);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [ref, handler, enabled]);
}
