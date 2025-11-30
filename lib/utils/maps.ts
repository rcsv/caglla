import type { PlaceData } from "@/lib/core/types";

export function buildGoogleTransitUrl(
	origin?: PlaceData | null,
	destination?: PlaceData | null,
): string | null {
	const getLocationParams = (place?: PlaceData | null) => {
		if (!place) return null;

		const lat = place.geometry?.location?.lat;
		const lng = place.geometry?.location?.lng;
		const hasCoords = typeof lat === "number" && typeof lng === "number";

		if (!hasCoords && !place.place_id) {
			return null;
		}

		return {
			coords: hasCoords ? `${lat},${lng}` : undefined,
			placeId: place.place_id || undefined,
		};
	};

	const originParams = getLocationParams(origin);
	const destinationParams = getLocationParams(destination);

	if (!originParams?.coords || !destinationParams?.coords) {
		return null;
	}

	const params = new URLSearchParams({
		api: "1",
		origin: originParams.coords,
		destination: destinationParams.coords,
		travelmode: "transit",
	});

	if (originParams.placeId) {
		params.set("origin_place_id", originParams.placeId);
	}

	if (destinationParams.placeId) {
		params.set("destination_place_id", destinationParams.placeId);
	}

	return `https://www.google.com/maps/dir/?${params.toString()}`;
}
