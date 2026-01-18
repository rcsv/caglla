"use client";

import React from "react";
import Image from "next/image";
import { Itinerary, ReservationInfo } from "@/lib/core/types";
import {
	getReservationSiteLabel,
	getReservationTypeLabel,
} from "@/lib/utils/reservation-utils";
import type { ReservationSite, ReservationType } from "@/lib/core/types";
import { IconRenderer } from "@/components/common/icons/IconRenderer";
import { UnifiedIcon } from "@/components/common/icons/UnifiedIcon";
import { placesApiHelpers } from "@/lib/api/google/places";
import Card from "@/components/common/Card";
import { toDate, toDateOrNull } from "@/lib/firebase/timestamp-utils";
import type { FirestoreDate } from "@/lib/core/types";
import { t } from "@/lib/i18n";

interface TripReservationDisplayProps {
	itineraries: Itinerary[];
	className?: string;
}

export default function TripReservationDisplay({
	itineraries,
	className = "",
}: TripReservationDisplayProps) {
	// 予約情報があるItineraryをフィルタリング
	const reservations = itineraries
		.filter((itinerary) => itinerary.reservation)
		.map((itinerary) => ({
			itinerary,
			reservation: itinerary.reservation!,
		}));

	if (reservations.length === 0) {
		return (
			<Card
				title={
					<div className="text-lg font-medium text-gray-800 flex items-center">
						<IconRenderer
							iconName="reservation"
							className="w-5 h-5 mr-2"
							color="#8B5CF6"
						/>
						{t("reservation.title")}
					</div>
				}
				className={className}
			>
				<div className="text-center py-4 text-gray-500">
					<IconRenderer
						iconName="reservation"
						className="w-8 h-8 mx-auto mb-2"
						color="#9CA3AF"
					/>
					<p>{t("reservation.empty")}</p>
					<p className="text-sm">{t("reservation.empty.description")}</p>
				</div>
			</Card>
		);
	}

	// 予約タイプ別にグループ化
	const reservationsByType = reservations.reduce(
		(acc, { itinerary, reservation }) => {
			const type = reservation.type;
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push({ itinerary, reservation });
			return acc;
		},
		{} as Record<
			string,
			Array<{ itinerary: Itinerary; reservation: ReservationInfo }>
		>,
	);

	// 予約タイプ → Iconify 名のマッピング
	const iconifyByType: Record<string, string> = {
		flight: "tabler:plane",
		rental_car: "tabler:car",
		hotel: "tabler:bed",
		dining: "tabler:tools-kitchen-2",
		other: "tabler:bookmark",
	};

	// 予約サイト → ロゴ画像URLのマッピング
	const siteLogos: Record<string, string> = {
		skyscanner: "/imgs/SkyScanner.webp",
		opentable: "/imgs/OpenTable.png",
		expedia: "/imgs/Expedia.png",
		booking_com: "/imgs/BookingCom.png",
		agoda: "/imgs/agoda.png",
		airbnb: "/imgs/Airbnb.jpeg",
		kayak: "/imgs/Kayak.png",
		tripadvisor:
			"https://logos-world.net/wp-content/uploads/2021/08/TripAdvisor-Logo.png",
		tabelog:
			"https://logos-world.net/wp-content/uploads/2021/08/Tabelog-Logo.png",
		hot_pepper:
			"https://logos-world.net/wp-content/uploads/2021/08/HotPepper-Logo.png",
		ana: "https://logos-world.net/wp-content/uploads/2021/08/ANA-Logo.png",
		jal: "https://logos-world.net/wp-content/uploads/2021/08/JAL-Logo.png",
		rakuten_travel:
			"https://logos-world.net/wp-content/uploads/2021/08/Rakuten-Travel-Logo.png",
		jalan: "https://logos-world.net/wp-content/uploads/2021/08/Jalan-Logo.png",
	};

	const formatDateTime = (date: FirestoreDate | null | undefined): string => {
		if (!date) return "";
		const d = toDateOrNull(date);
		if (!d) return "";
		return d.toLocaleString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// 時刻表示ルールに基づくフォーマット関数
	const formatTimeWithRule = (
		startDate: FirestoreDate | null | undefined,
		endDate: FirestoreDate | null | undefined,
	): { start: string; end: string } => {
		const start = startDate ? toDateOrNull(startDate) : null;
		const end = endDate ? toDateOrNull(endDate) : null;
		if (!start) return { start: "", end: "" };

		const startFormatted = start.toLocaleString("ja-JP", {
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});

		if (!end) return { start: startFormatted, end: "" };

		const startYear = start.getFullYear();
		const startMonth = start.getMonth();
		const startDay = start.getDate();

		const endYear = end.getFullYear();
		const endMonth = end.getMonth();
		const endDay = end.getDate();

		let endFormatted = "";
		if (
			startYear === endYear &&
			startMonth === endMonth &&
			startDay === endDay
		) {
			endFormatted = end.toLocaleString("ja-JP", {
				hour: "2-digit",
				minute: "2-digit",
			});
		} else if (startYear === endYear && startMonth === endMonth) {
			endFormatted = end.toLocaleString("ja-JP", {
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			});
		} else if (startYear === endYear) {
			endFormatted = end.toLocaleString("ja-JP", {
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			});
		} else {
			endFormatted = end.toLocaleString("ja-JP", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			});
		}

		return { start: startFormatted, end: endFormatted };
	};

	const formatTime = (date: FirestoreDate | null | undefined): string => {
		const d = date ? toDateOrNull(date) : null;
		if (!d) return "";
		return d.toLocaleTimeString("ja-JP", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<Card
			title={
				<div className="text-lg font-medium text-gray-800 flex items-center">
					<IconRenderer
						iconName="reservation"
						className="w-5 h-5 mr-2"
						color="#8B5CF6"
					/>
					{t("reservation.title")} ({reservations.length}
					{t("reservation.count")})
				</div>
			}
			className={className}
		>
			<div className="space-y-6">
				{Object.entries(reservationsByType).map(([type, typeReservations]) => (
					<div key={type}>
						<div className="flex items-center mb-4">
							<UnifiedIcon
								icon={iconifyByType[type as string] || "tabler:calendar-check"}
								className="w-5 h-5 mr-2 text-gray-700"
							/>
							<h4 className="text-lg font-semibold text-gray-700">
								{getReservationTypeLabel(type as ReservationType)}
							</h4>
							<span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
								{typeReservations.length}件
							</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{typeReservations.map(({ itinerary, reservation }) => {
								// 時刻表示ルールを適用
								const timeInfo =
									type === "flight"
										? formatTimeWithRule(
												reservation.departure_at,
												reservation.arrival_at,
											)
										: formatTimeWithRule(
												reservation.start_date,
												reservation.end_date,
											);
								const photoRef =
									itinerary.place_data?.photos?.[0]?.photo_reference;
								const siteLabel = reservation.reservation_site
									? getReservationSiteLabel(
											reservation.reservation_site as ReservationSite,
										)
									: null;

								// 到着空港名を取得（到着空港コードに一致するitineraryを探す）
								let arrivalAirportName: string | undefined;
								if (
									type === "flight" &&
									reservation.arrival_airport
								) {
									// 同じ日の次のitinerary、または到着空港コードを含むitineraryを探す
									const currentIndex = itineraries.findIndex(
										(it) => it.id === itinerary.id,
									);
									// まずは次のitineraryをチェック
									if (
										currentIndex >= 0 &&
										currentIndex < itineraries.length - 1
									) {
										const nextItinerary = itineraries[currentIndex + 1];
										if (nextItinerary?.title) {
											arrivalAirportName = nextItinerary.title;
										}
									}
									// 次のitineraryが見つからない場合、到着空港コードに一致するitineraryを探す
									if (!arrivalAirportName) {
										const matchingItinerary = itineraries.find(
											(it) =>
												it.place_data?.name
													?.toUpperCase()
													.includes(
														reservation.arrival_airport.toUpperCase(),
													) ||
												it.title
													?.toUpperCase()
													.includes(
														reservation.arrival_airport.toUpperCase(),
													),
										);
										if (matchingItinerary?.title) {
											arrivalAirportName = matchingItinerary.title;
										}
									}
								}

								return (
									<div
										key={itinerary.id}
										className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden min-w-0"
									>
										{/* カードヘッダー（画像付き） */}
										<div className="relative h-28 bg-gray-200">
											{photoRef ? (
												<Image
													src={placesApiHelpers.getPhotoUrl(photoRef, 800)}
													alt={itinerary.title}
													fill
													className="object-cover"
													sizes="(max-width: 768px) 100vw, 50vw"
													priority={false}
												/>
											) : (
												<div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
													<UnifiedIcon
														icon={
															iconifyByType[type as string] ||
															"tabler:calendar-check"
														}
														className="w-7 h-7 text-white/90"
													/>
												</div>
											)}
											{/* オーバーレイ */}
											<div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
											{/* オーバーレイ情報 */}
											<div className="absolute bottom-2 left-2 right-2">
												<h5 className="font-bold text-white text-base truncate drop-shadow-sm">
													{itinerary.title}
												</h5>
												{/* vicinityがない場合はformatted_addressの最初の部分を使用 */}
												{(itinerary.place_data?.vicinity ||
													itinerary.place_data?.formatted_address) && (
													<p className="text-xs text-white/90 truncate drop-shadow-sm">
														{itinerary.place_data?.vicinity ||
															itinerary.place_data?.formatted_address?.split(
																",",
															)[0] ||
															""}
													</p>
												)}
											</div>
										</div>

										{/* カードボディ */}
										<div className="p-4 space-y-3">
											{/* 飛行機予約の特別レイアウト */}
											{type === "flight" ? (
												<div className="space-y-4">
													{/* フライト番号（最上部、大きく強調） */}
													{reservation.flight_number && (
														<div className="text-left">
															<div className="text-xs text-gray-500 mb-1">
																Flight
															</div>
															<div className="text-2xl font-bold text-blue-600">
																{reservation.flight_number}
															</div>
														</div>
													)}

													{/* 空港コード（中央、最大サイズ） */}
													{reservation.departure_airport &&
														reservation.arrival_airport && (
															<div className="flex items-start justify-between">
																<div className="text-left flex-1">
																	<div className="text-3xl font-bold text-blue-600 mb-1 leading-none">
																		{reservation.departure_airport}
																	</div>
																	<div className="text-xs text-gray-500 min-h-[1rem]">
																		{itinerary.title}
																	</div>
																</div>

																{/* 飛行機アイコン */}
																<div className="mx-4 flex items-center self-center">
																	<UnifiedIcon
																		icon="tabler:plane"
																		className="w-6 h-6 text-blue-600"
																	/>
																</div>

																<div className="text-left flex-1">
																	<div className="text-3xl font-bold text-blue-600 mb-1 leading-none">
																		{reservation.arrival_airport}
																	</div>
																	<div className="text-xs text-gray-500 min-h-[1rem]">
																		{arrivalAirportName || "Destination"}
																	</div>
																</div>
															</div>
														)}

													{/* 時刻情報（下部、中サイズ） */}
													<div className="flex justify-between">
														<div className="text-left">
															<div className="text-xs text-gray-500 mb-1">
																Departure
															</div>
															<div className="text-lg font-semibold text-gray-800">
																{timeInfo.start}
															</div>
														</div>
														<div className="text-left">
															<div className="text-xs text-gray-500 mb-1">
																Arrival
															</div>
															<div className="text-lg font-semibold text-gray-800">
																{timeInfo.end || "TBD"}
															</div>
														</div>
													</div>

													{/* 確認番号（小さく） */}
													{reservation.confirmation_number && (
														<div className="text-left">
															<div className="text-xs text-gray-500 mb-1">
																Confirmation
															</div>
															<div className="text-sm font-mono bg-purple-100 text-purple-800 px-3 py-1 rounded">
																{reservation.confirmation_number}
															</div>
														</div>
													)}
												</div>
											) : (
												/* その他の予約タイプ（従来のレイアウト） */
												<>
													{/* 時刻情報（最重要 - 大きく強調） */}
													<div className="text-left">
														<div className="text-xl font-bold text-gray-900 mb-1">
															{timeInfo.start}
														</div>
														{timeInfo.end && (
															<div className="text-sm text-gray-600">
																{t("reservation.timeRange")} {timeInfo.end}
															</div>
														)}
													</div>

													{/* 予約詳細（重要度に応じて階層化） */}
													<div className="space-y-2">
														{reservation.confirmation_number && (
															<div className="text-left">
																<span className="text-sm font-mono bg-purple-100 text-purple-800 px-3 py-1 rounded">
																	{reservation.confirmation_number}
																</span>
															</div>
														)}
													</div>

													{/* メモ（補助情報 - 小さく） */}
													{reservation.notes && (
														<div className="text-left">
															<div className="text-xs text-gray-500 bg-gray-50 p-2 rounded line-clamp-2">
																{reservation.notes}
															</div>
														</div>
													)}
												</>
											)}
										</div>

										{/* カードフッター */}
										<div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
											{/* 予約サイトリンクと企業名の組み合わせ */}
											{reservation.reservation_url && (
												<div className="space-y-2">
													<a
														href={reservation.reservation_url}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1"
													>
														<IconRenderer
															iconName="link"
															className="h-4 w-4"
															color="#10B981"
														/>
														{t("reservation.action.openSite")}
													</a>

													{/* 企業名（ボタンの下、右寄せ） */}
													{reservation.reservation_site && siteLabel && (
														<div className="flex items-center justify-end">
															{siteLogos[reservation.reservation_site] && (
																<div className="relative w-3 h-3 mr-1">
																	<Image
																		src={
																			siteLogos[reservation.reservation_site]
																		}
																		alt={reservation.reservation_site}
																		fill
																		className="object-contain opacity-70"
																		sizes="12px"
																	unoptimized
																		onError={(e) => {
																			const target =
																				e.currentTarget as HTMLImageElement;
																			target.style.display = "none";
																		}}
																	/>
																</div>
															)}
															<span className="text-xs text-gray-400">
																{siteLabel}
															</span>
														</div>
													)}
												</div>
											)}

											{/* 予約サイト情報のみの場合（URLがない場合） */}
											{!reservation.reservation_url &&
												reservation.reservation_site &&
												siteLabel && (
													<div className="flex items-center justify-end">
														{siteLogos[reservation.reservation_site] && (
															<div className="relative w-3 h-3 mr-1">
																<Image
																	src={siteLogos[reservation.reservation_site]}
																	alt={reservation.reservation_site}
																	fill
																	className="object-contain opacity-70"
																	sizes="12px"
																	unoptimized
																	onError={(e) => {
																		const target =
																			e.currentTarget as HTMLImageElement;
																		target.style.display = "none";
																	}}
																/>
															</div>
														)}
														<span className="text-xs text-gray-400">
															{siteLabel}
														</span>
													</div>
												)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}
