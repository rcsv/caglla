import { Icon } from "@iconify/react";
import type { Trip } from "@/lib/core/types";
import { t } from "@/lib/i18n";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { generateStaticMapUrl } from "@/lib/utils/pdf/helpers/map";

interface NextTripStaticMapProps {
	trip: Trip;
}

export function NextTripStaticMap({ trip }: NextTripStaticMapProps) {
	const mapUrlFromGeometry = generateStaticMapUrl(
		trip.destination_place_id,
		trip.destination_place,
	);

	// フロントエンドで geometry が無い場合のフォールバック: 文字列中心で Static Map を生成
	const mapUrl =
		mapUrlFromGeometry ||
		(() => {
			const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
			const centerText =
				trip.destination_place?.formatted_address ||
				trip.destination_place?.name ||
				trip.destination;

			if (!apiKey || !centerText) return null;

			const width = 600;
			const height = 320;
			const zoom = 8;

			const params = new URLSearchParams({
				center: centerText,
				zoom: zoom.toString(),
				size: `${width}x${height}`,
				scale: "2",
				maptype: "roadmap",
				format: "png",
				key: apiKey,
			});

			return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
		})();

	const startDate = toDateOrNull(trip.start_date);
	const endDate = toDateOrNull(trip.end_date);

	return (
		<div className="relative h-full rounded-sm overflow-hidden border border-gray-200 bg-gray-50">
			{mapUrl ? (
				<img
					src={mapUrl}
					alt={trip.destination_place?.name || trip.destination || "Trip map"}
					className="h-full w-full object-cover"
					loading="lazy"
				/>
			) : (
				<div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
					<div className="text-center">
						<Icon icon="mdi:map-search-outline" className="mx-auto mb-2 h-10 w-10" />
						<p className="text-sm font-medium">
							{t("home.dashboard.nextTrip.empty.mapPlaceholder")}
						</p>
						<p className="text-xs text-gray-500">
							{t("home.dashboard.nextTrip.empty.mapDescription")}
						</p>
					</div>
				</div>
			)}

			<div className="absolute left-3 top-3 rounded bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
				<p className="text-xs font-semibold text-gray-900 line-clamp-1">
					{trip.destination_place?.name || trip.destination || "Destination"}
				</p>
				{startDate && endDate && (
					<p className="text-[11px] text-gray-600">
						{(() => {
							const startMonth = startDate.getMonth() + 1;
							const startDay = startDate.getDate();
							const endMonth = endDate.getMonth() + 1;
							const endDay = endDate.getDate();
							return startMonth === endMonth
								? `${startMonth}/${startDay} - ${endDay}`
								: `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
						})()}
					</p>
				)}
			</div>
		</div>
	);
}

