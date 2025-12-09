"use client";

import { t } from "@/lib/i18n";

interface POIContactSectionProps {
	formattedPhoneNumber?: string;
	website?: string;
	googleMapsUrl?: string;
	language: string;
}

export function POIContactSection({
	formattedPhoneNumber,
	website,
	googleMapsUrl,
	language,
}: POIContactSectionProps) {
	return (
		<div className="flex flex-col gap-2">
			{formattedPhoneNumber && (
				<button
					type="button"
					onClick={() =>
						window.open(`tel:${formattedPhoneNumber}`, "_self")
					}
					className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
					title={formattedPhoneNumber}
				>
					<svg
						className="w-3.5 h-3.5 flex-shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<title>{t("common.phone", language)}</title>
						<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.3 1.77.54 2.61a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.47-1.07a2 2 0 012.11-.45c.84.24 1.71.42 2.61.54A2 2 0 0122 16.92z" />
					</svg>
					<span className="truncate text-gray-700">
						{formattedPhoneNumber}
					</span>
				</button>
			)}
			{website && (
				<button
					type="button"
					onClick={() =>
						window.open(website, "_blank", "noopener,noreferrer")
					}
					className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
					title={website}
				>
					<svg
						className="w-3.5 h-3.5 flex-shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<title>{t("common.website", language)}</title>
						<circle cx="12" cy="12" r="10" />
						<path d="M2 12h20" />
						<path d="M12 2a15.3 15.3 0 010 20" />
						<path d="M12 2a15.3 15.3 0 000 20" />
					</svg>
					<span className="truncate text-gray-700">
						{(() => {
							try {
								const url = new URL(website);
								return url.hostname.replace("www.", "");
													} catch {
														return t("common.website", language);
													}
						})()}
					</span>
				</button>
			)}
			{googleMapsUrl && (
				<button
					type="button"
					onClick={() =>
						window.open(googleMapsUrl, "_blank", "noopener,noreferrer")
					}
					className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
					title="Google Maps"
				>
					<svg
						className="w-3.5 h-3.5 flex-shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<title>Google Maps</title>
						<path d="M3.5 6.5l5.4-2.1 5.2 2.1 5.4-2.1v12.9l-5.4 2.1-5.2-2.1-5.4 2.1V6.5z" />
						<path d="M8.9 4.4v12.9" />
						<path d="M14.1 6.5v12.9" />
					</svg>
					<span className="truncate text-gray-700">Maps</span>
				</button>
			)}
		</div>
	);
}

