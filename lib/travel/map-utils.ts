import { calculateDistance } from "@/lib/utils/distance";

const SMOOTH_PAN_DISTANCE_THRESHOLD = 5; // 約5km（滑らかなパンを使用する距離の閾値）

export interface SmoothMoveOptions {
	onMoveStart?: () => void;
	onMoveComplete?: () => void;
}

/**
 * 滑らかな移動でマップを更新する
 * 距離が近い場合はパン、遠い場合は即座に移動
 *
 * @param map Google Maps Map インスタンス
 * @param targetLat 目標緯度
 * @param targetLng 目標経度
 * @param targetZoom 目標ズームレベル
 * @param options オプション（コールバックなど）
 */
export function smoothMoveToLocation(
	map: google.maps.Map,
	targetLat: number,
	targetLng: number,
	targetZoom: number,
	options?: SmoothMoveOptions,
): void {
	const currentCenter = map.getCenter();
	if (!currentCenter) return;

	const currentLat = currentCenter.lat();
	const currentLng = currentCenter.lng();

	const distance = calculateDistance(
		currentLat,
		currentLng,
		targetLat,
		targetLng,
	);

	options?.onMoveStart?.();

	if (distance < SMOOTH_PAN_DISTANCE_THRESHOLD) {
		// 近い場合は滑らかなパン
		map.panTo({ lat: targetLat, lng: targetLng });

		// ズームレベルも段階的に変更
		const currentZoom = map.getZoom();
		if (currentZoom !== targetZoom) {
			setTimeout(() => {
				map.setZoom(targetZoom);
				options?.onMoveComplete?.();
			}, 300); // パンの完了後にズーム
		} else {
			options?.onMoveComplete?.();
		}
	} else {
		// 遠い場合は即座に移動
		map.setCenter({ lat: targetLat, lng: targetLng });
		map.setZoom(targetZoom);
		options?.onMoveComplete?.();
	}
}

