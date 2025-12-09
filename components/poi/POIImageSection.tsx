"use client";

import Image from "next/image";
import { placesApiHelpers } from "@/lib/api/google/places";
import { t } from "@/lib/i18n";
import type { POIDialogAction } from "@/hooks/usePOIDialogState";

interface Photo {
	photo_reference: string;
	height?: number;
	width?: number;
}

interface CachedImage {
	url: string;
	cached: boolean;
}

interface POIImageSectionProps {
	photos: Photo[];
	cachedImages: CachedImage[];
	currentPhotoIndex: number;
	imageLoading: boolean;
	placeName: string;
	onOpenGallery: () => void;
	debugZoomLevel?: number;
	showZoomDebugInfo?: boolean;
	language: string;
}

export function POIImageSection({
	photos,
	cachedImages,
	currentPhotoIndex,
	imageLoading,
	placeName,
	onOpenGallery,
	debugZoomLevel,
	showZoomDebugInfo,
	language,
}: POIImageSectionProps) {
	if (!photos || photos.length === 0) return null;

	return (
		<>
			<div
				className="relative aspect-square bg-gray-200 rounded overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
				onClick={onOpenGallery}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onOpenGallery();
					}
				}}
			>
				{cachedImages[currentPhotoIndex] ? (
					<Image
						src={cachedImages[currentPhotoIndex].url}
						alt={t("poi.photoOf").replace("{name}", placeName)}
						width={144}
						height={144}
						className="w-full h-full object-cover"
						unoptimized
						onError={(e) => {
							// キャッシュされた画像が読み込めない場合は、元のGoogle Photo URLにフォールバック
							const target = e.target as HTMLImageElement;
							target.src = placesApiHelpers.getPhotoUrl(
								photos[currentPhotoIndex].photo_reference,
								300,
							);
						}}
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						{imageLoading ? (
							<div className="text-gray-500 text-xs">
								{t("poi.loading")}
							</div>
						) : (
							<Image
								src={placesApiHelpers.getPhotoUrl(
									photos[currentPhotoIndex].photo_reference,
									300,
								)}
								alt={t("poi.photoOf").replace("{name}", placeName)}
								width={144}
								height={144}
								className="w-full h-full object-cover"
								unoptimized
							/>
						)}
					</div>
				)}
				{photos.length > 1 && (
					<div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
						{t("gallery.photoCount", language).replace(
							"{count}",
							(photos.length - 1).toString(),
						)}
					</div>
				)}
				{/* キャッシュ状態インジケーター */}
				{cachedImages[currentPhotoIndex]?.cached && (
					<div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
						{t("poi.cached")}
					</div>
				)}
				{/* クリック可能インジケーター */}
				<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
					<div className="opacity-0 group-hover:opacity-100 transition-opacity">
						<svg
							className="w-6 h-6 text-white drop-shadow-lg"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>{t("gallery.open", language)}</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
							/>
						</svg>
					</div>
				</div>
			</div>
			{showZoomDebugInfo && debugZoomLevel !== undefined && (
				<div className="mt-2 text-[11px] text-gray-500 leading-snug">
					Debug zoom: {debugZoomLevel}
				</div>
			)}
		</>
	);
}

