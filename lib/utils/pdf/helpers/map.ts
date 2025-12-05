/**
 * 地図関連のヘルパー関数
 */

/**
 * Google Maps Static APIのURLを生成（place_id はサポート外のため lat/lng 必須）
 * 
 * 注意: Static Maps APIは `place_id:` を `center` パラメータにサポートしていないため、
 * 緯度経度（lat, lng）を使用する必要があります。
 */
export function generateStaticMapUrl(
	destinationPlaceId?: string,
	destinationPlace?: any,
): string | null {
	// バックエンド用キーを優先（サーバーサイド専用、サイト制限なし）
	// フォールバック: フロントエンド用キー（後方互換性のため）
	const apiKey =
		process.env.GOOGLE_PLACES_API_KEY ||
		process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

	if (!apiKey) {
		return null;
	}

	// 地図のサイズ（目次ページの .toc-map のサイズに合わせる）
	// Static Maps API の最大サイズは 640x640 だが、400x320 は安全
	const width = 400;
	const height = 320;
	const zoom = 12;

	let centerParam = "";

	// geometry.location が lat()/lng() を持つケースと、生の number ケース両方に対応
	if (destinationPlace?.geometry?.location) {
		const loc = destinationPlace.geometry.location;

		// 関数形式（lat(), lng()）と生の値（lat, lng）の両方に対応
		const lat =
			typeof loc.lat === "function" ? loc.lat() : loc.lat;
		const lng =
			typeof loc.lng === "function" ? loc.lng() : loc.lng;

		// 型チェック：数値であることを確認
		if (typeof lat === "number" && typeof lng === "number") {
			centerParam = `${lat},${lng}`;
		}
	}

	// geometry がない → place_id だけでは Static Maps は生成不可
	if (!centerParam) {
		// ログ出力：キャッシュが遅れている可能性や、データ構造の問題を記録
		console.warn(
			"[generateStaticMapUrl] geometry.location が無いため Static Map を生成できません。",
			{
				destinationPlaceId,
				hasDestinationPlace: !!destinationPlace,
				hasGeometry: !!destinationPlace?.geometry,
				hasLocation: !!destinationPlace?.geometry?.location,
			},
		);
		return null;
	}

	// Google Maps Static API URL
	const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
	const params = new URLSearchParams({
		center: centerParam,
		zoom: zoom.toString(),
		size: `${width}x${height}`,
		scale: "2",
		maptype: "roadmap",
		format: "png",
		key: apiKey,
	});

	return `${baseUrl}?${params.toString()}`;
}
