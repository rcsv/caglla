"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
	ReservationInfo,
	ReservationType,
	ReservationSite,
	Itinerary,
	Day,
	ActivityTag,
	PrimaryCategoryType,
	ReservationTemplate,
} from "@/lib/core/types";
import {
	validateReservationInfo,
	getReservationTypeLabel,
	getReservationSiteLabel,
	getReservationTypeIcon,
	validateAirportCode,
	validateFlightNumber,
} from "@/lib/utils/reservation-utils";
import logger from "@/lib/core/logger";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Textarea from "@/components/common/Textarea";
import ReservationTemplateModal from "@/components/modals/ReservationTemplateModal";
import { toDate, toDateOrNull } from "@/lib/firebase/timestamp-utils";
import type { FirestoreDate } from "@/lib/core/types";
import { Icon } from "@iconify/react";
import { t } from "@/lib/i18n";

interface ReservationInfoModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (reservation: ReservationInfo) => Promise<void>;
	initialReservation?: ReservationInfo | null;
	itineraryId: string;
	itinerary?: Itinerary | null;
	day?: Day | null;
}

// 予約タイプの配列を取得（i18n対応）
const getReservationTypes = (): {
	value: ReservationType;
	label: string;
	icon: string;
}[] => [
	{ value: "flight", label: t("reservation.type.flight"), icon: "✈️" },
	{ value: "rental_car", label: t("reservation.type.rentalCar"), icon: "🚗" },
	{ value: "hotel", label: t("reservation.type.hotel"), icon: "🏨" },
	{ value: "dining", label: t("reservation.type.dining"), icon: "🍽️" },
	{ value: "other", label: t("reservation.type.other"), icon: "📋" },
];

// 予約サイトの配列を取得（i18n対応）
const getReservationSites = (): { value: ReservationSite; label: string }[] => [
	{ value: "expedia", label: t("reservation.site.expedia") },
	{ value: "booking_com", label: t("reservation.site.bookingCom") },
	{ value: "agoda", label: t("reservation.site.agoda") },
	{ value: "trivago", label: t("reservation.site.trivago") },
	{ value: "airbnb", label: t("reservation.site.airbnb") },
	{ value: "kayak", label: t("reservation.site.kayak") },
	{ value: "skyscanner", label: t("reservation.site.skyscanner") },
	{ value: "tripadvisor", label: t("reservation.site.tripadvisor") },
	{ value: "trip_com", label: t("reservation.site.tripCom") },
	{ value: "opentable", label: t("reservation.site.opentable") },
	{ value: "tabelog", label: t("reservation.site.tabelog") },
	{ value: "hot_pepper", label: t("reservation.site.hotPepper") },
	{ value: "ana", label: t("reservation.site.ana") },
	{ value: "jal", label: t("reservation.site.jal") },
	{ value: "rakuten_travel", label: t("reservation.site.rakutenTravel") },
	{ value: "jalan", label: t("reservation.site.jalan") },
	{ value: "other", label: t("reservation.site.other") },
];

// アクティビティタグから予約タイプへのマッピング
const getReservationTypeFromActivityTag = (
	activityTag: ActivityTag | null | undefined,
): ReservationType | null => {
	if (!activityTag) return null;

	const { primaryCategory, secondaryCategory } = activityTag;
	// まずセカンダリIDで厳密に判定（マスタはIDで管理されているため）
	if (secondaryCategory === "flight") return "flight";
	if (secondaryCategory === "car_rental") return "rental_car";

	// セカンダリで判定できない場合は一次カテゴリで大まかに判定
	if (primaryCategory === "accommodation") return "hotel";
	if (primaryCategory === "dining") return "dining";
	if (primaryCategory === "transportation") return null;

	return null;
};

// Dayの日付から開始日時のデフォルト値を生成
const getDefaultStartDateTime = (day: Day | null | undefined): Date | null => {
	if (!day?.date) return null;

	try {
		const dayDate = toDate(day.date);
		// 日付の9:00をデフォルトの開始時刻とする
		dayDate.setHours(9, 0, 0, 0);
		return dayDate;
	} catch (error) {
		logger.error("Error parsing day date:", error);
		return null;
	}
};

// Day の日付と "HH:mm" 形式の時刻文字列を合成して Date を生成
const combineDayAndTime = (
	day: Day | null | undefined,
	time: string | null | undefined,
): Date | null => {
	if (!day?.date || !time) return null;
	try {
		const [hh, mm] = time.split(":").map((v) => parseInt(v, 10));
		if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
		const date = toDate(day.date);
		date.setHours(hh, mm, 0, 0);
		return date;
	} catch (e) {
		logger.error("Failed to combine day and time:", e);
		return null;
	}
};

// datetime-local 入力用にローカルタイムの文字列 (YYYY-MM-DDTHH:mm) を生成
const formatForDatetimeLocal = (
	value: FirestoreDate | null | undefined,
): string => {
	const d = value ? toDateOrNull(value) : null;
	if (!d) return "";
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	const hh = String(d.getHours()).padStart(2, "0");
	const mm = String(d.getMinutes()).padStart(2, "0");
	return `${y}-${m}-${day}T${hh}:${mm}`;
};

export default function ReservationInfoModal({
	isOpen,
	onClose,
	onSave,
	initialReservation,
	itineraryId,
	itinerary,
	day,
}: ReservationInfoModalProps) {
	const [reservation, setReservation] = useState<Partial<ReservationInfo>>({
		type: "hotel",
		created_at: new Date(),
		updated_at: new Date(),
	});
	const [errors, setErrors] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [showTemplateModal, setShowTemplateModal] = useState(false);
	const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// 初期データの設定
	useEffect(() => {
		if (isOpen) {
			if (initialReservation) {
				setReservation(initialReservation);
			} else {
				// 新しい予約の場合、ItineraryとDayの情報からデフォルト値を設定
				const defaultReservationType =
					getReservationTypeFromActivityTag(itinerary?.activity_tag) || "hotel";
				// 時刻継承: Itineraryに時刻があればDayと合成。なければDayのデフォルト(09:00)
				const inheritedStart = combineDayAndTime(day, itinerary?.start_time);
				const inheritedEnd = combineDayAndTime(day, itinerary?.end_time);
				const defaultStartDateTime =
					inheritedStart || getDefaultStartDateTime(day);

				const newReservation: Partial<ReservationInfo> = {
					type: defaultReservationType,
					created_at: new Date(),
					updated_at: new Date(),
				};

				// 開始日時を設定（Itineraryの時刻優先、なければDay基準）
				if (defaultStartDateTime) {
					if (defaultReservationType === "flight") {
						// 飛行機の場合は出発日時として設定
						newReservation.departure_at = defaultStartDateTime;
						// 到着日時は Itineraryのend_time があれば優先、なければ +2時間
						if (inheritedEnd) {
							newReservation.arrival_at = inheritedEnd;
						} else {
							const arrivalTime = new Date(
								defaultStartDateTime.getTime() + 2 * 60 * 60 * 1000,
							);
							newReservation.arrival_at = arrivalTime;
						}
					} else {
						// その他の場合は開始日時として設定
						newReservation.start_date = defaultStartDateTime;
						// 終了日時は Itineraryのend_time があれば同日で合成、なければ +1日
						if (inheritedEnd) {
							newReservation.end_date = inheritedEnd;
						} else {
							const endTime = new Date(
								defaultStartDateTime.getTime() + 24 * 60 * 60 * 1000,
							);
							newReservation.end_date = endTime;
						}
					}
				}

				setReservation(newReservation);
			}
			setErrors([]);
		}
	}, [isOpen, initialReservation, itinerary, day]);

	// 予約タイプ変更時の処理
	const handleTypeChange = (type: ReservationType) => {
		setReservation((prev: any) => ({
			...prev,
			type,
			// タイプ変更時に関連フィールドをクリア
			flight_number: undefined,
			departure_airport: undefined,
			arrival_airport: undefined,
			departure_at: undefined,
			arrival_at: undefined,
			airline: undefined,
			start_date: undefined,
			end_date: undefined,
		}));
		setErrors([]);
	};

	// 保存処理
	// テンプレートから予約情報を読み込む
	const handleLoadTemplate = (template: ReservationTemplate) => {
		setReservation((prev) => ({
			...prev,
			type: template.type,
			reservation_site: template.reservation_site,
			airline: template.airline,
			departure_airport: template.departure_airport,
			arrival_airport: template.arrival_airport,
			notes: template.notes,
		}));
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			setErrors([]);

			// バリデーション
			const validation = validateReservationInfo(reservation);
			if (!validation.isValid) {
				setErrors(validation.errors);
				return;
			}

			// 保存実行
			await onSave(reservation as ReservationInfo);
			onClose();
		} catch (error) {
			logger.error(t("reservation.saveFailed"), error);
			setErrors([t("reservation.saveFailed")]);
		} finally {
			setIsSaving(false);
		}
	};

	// 空港コードのバリデーション
	const validateAirportCodeField = (code: string) => {
		if (code && !validateAirportCode(code)) {
			return t("reservation.validation.airportCode");
		}
		return null;
	};

	// 便名のバリデーション
	const validateFlightNumberField = (flightNumber: string) => {
		if (flightNumber && !validateFlightNumber(flightNumber)) {
			return t("reservation.validation.flightNumber");
		}
		return null;
	};

	if (!isOpen) return null;

	const modal = (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center zidx-dialog-overlay">
			<div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<h2 className="text-xl font-bold">
							{initialReservation
								? t("reservation.modal.editTitle")
								: t("reservation.modal.addTitle")}
						</h2>
						{!initialReservation && (
							<>
								<button
									onClick={() => setShowTemplateModal(true)}
									className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
									title={t("reservation.modal.loadTemplate")}
								>
									<Icon icon="mdi:bookmark-multiple" className="w-4 h-4" />
									<span className="hidden sm:inline">
										{t("reservation.modal.template")}
									</span>
								</button>
								{reservation.type && (
									<button
										onClick={() => {
											setShowSaveAsTemplateModal(true);
											setShowTemplateModal(true);
										}}
										className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
										title={t("reservation.modal.saveAsTemplate")}
									>
										<Icon icon="mdi:bookmark-plus" className="w-4 h-4" />
										<span className="hidden sm:inline">
											{t("reservation.modal.saveAsTemplate")}
										</span>
									</button>
								)}
							</>
						)}
					</div>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 text-2xl"
					>
						×
					</button>
				</div>

				{/* エラー表示 */}
				{errors.length > 0 && (
					<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
						<ul className="list-disc list-inside">
							{errors.map((error, index) => (
								<li key={index}>{error}</li>
							))}
						</ul>
					</div>
				)}

				<div className="space-y-6">
					{/* 予約タイプ選択 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							{t("reservation.field.type")} *
						</label>
						<div className="grid grid-cols-2 gap-2">
							{getReservationTypes().map((type) => (
								<button
									key={type.value}
									onClick={() => handleTypeChange(type.value)}
									className={`p-3 border rounded-lg text-left transition-colors bg-white ${
										reservation.type === type.value
											? "border-emerald-500 bg-emerald-50 text-emerald-700"
											: "border-gray-300 hover:border-gray-400 text-gray-900"
									}`}
									style={
										reservation.type !== type.value
											? { color: "#111827" } /* text-gray-900 を明示的に指定（Safari/Edge対応） */
											: undefined
									}
								>
									<div className="flex items-center">
										<span className="text-lg mr-2">{type.icon}</span>
										<span className="font-medium">{type.label}</span>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* 飛行機の場合のフィールド */}
					{reservation.type === "flight" && (
						<>
							<div className="grid grid-cols-2 gap-4">
								<Input
									label={`${t("reservation.field.flightNumber")} *`}
									value={reservation.flight_number || ""}
									onChange={(e) =>
										setReservation((prev: any) => ({
											...prev,
											flight_number: e.target.value.toUpperCase(),
										}))
									}
									placeholder={t("reservation.placeholder.flightNumber")}
									error={
										validateFlightNumberField(
											reservation.flight_number || "",
										) || undefined
									}
								/>
								<Input
									label={t("reservation.field.airline")}
									value={reservation.airline || ""}
									onChange={(e) =>
										setReservation((prev: any) => ({
											...prev,
											airline: e.target.value,
										}))
									}
									placeholder={t("reservation.placeholder.airline")}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<Input
									label={`${t("reservation.field.departureAirport")} *`}
									value={reservation.departure_airport || ""}
									onChange={(e) =>
										setReservation((prev: any) => ({
											...prev,
											departure_airport: e.target.value.toUpperCase(),
										}))
									}
									placeholder={t("reservation.placeholder.departureAirport")}
									error={
										validateAirportCodeField(
											reservation.departure_airport || "",
										) || undefined
									}
								/>
								<Input
									label={`${t("reservation.field.arrivalAirport")} *`}
									value={reservation.arrival_airport || ""}
									onChange={(e) =>
										setReservation((prev: any) => ({
											...prev,
											arrival_airport: e.target.value.toUpperCase(),
										}))
									}
									placeholder={t("reservation.placeholder.arrivalAirport")}
									error={
										validateAirportCodeField(
											reservation.arrival_airport || "",
										) || undefined
									}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<Input
									label={`${t("reservation.field.departureDateTime")} *`}
									type="datetime-local"
									value={formatForDatetimeLocal(reservation.departure_at)}
									onChange={(e) => {
										const departureTime = new Date(e.target.value);
										setReservation((prev: any) => {
											const newReservation = {
												...prev,
												departure_at: departureTime,
											};
											// 到着日時が空の場合は出発日時+2時間を自動設定
											if (!prev.arrival_at) {
												const arrivalTime = new Date(
													departureTime.getTime() + 2 * 60 * 60 * 1000,
												); // +2時間
												newReservation.arrival_at = arrivalTime;
											}
											return newReservation;
										});
									}}
								/>
								<Input
									label={`${t("reservation.field.arrivalDateTime")} *`}
									type="datetime-local"
									value={formatForDatetimeLocal(reservation.arrival_at)}
									onChange={(e) =>
										setReservation((prev: any) => ({
											...prev,
											arrival_at: new Date(e.target.value),
										}))
									}
									min={
										reservation.departure_at
											? formatForDatetimeLocal(reservation.departure_at)
											: undefined
									}
								/>
							</div>
						</>
					)}

					{/* 飛行機以外の場合のフィールド */}
					{reservation.type && reservation.type !== "flight" && (
						<div className="grid grid-cols-2 gap-4">
							<Input
								label={`${t("reservation.field.startDateTime")} *`}
								type="datetime-local"
								value={formatForDatetimeLocal(reservation.start_date)}
								onChange={(e) => {
									const startTime = new Date(e.target.value);
									setReservation((prev: any) => {
										const newReservation = { ...prev, start_date: startTime };
										// 終了日時が空の場合は開始日時+1日を自動設定
										if (!prev.end_date) {
											const endTime = new Date(
												startTime.getTime() + 24 * 60 * 60 * 1000,
											); // +1日
											newReservation.end_date = endTime;
										}
										return newReservation;
									});
								}}
							/>
							<Input
								label={`${t("reservation.field.endDateTime")} *`}
								type="datetime-local"
								value={formatForDatetimeLocal(reservation.end_date)}
								onChange={(e) =>
									setReservation((prev: any) => ({
										...prev,
										end_date: new Date(e.target.value),
									}))
								}
								min={
									reservation.start_date
										? formatForDatetimeLocal(reservation.start_date)
										: undefined
								}
							/>
						</div>
					)}

					{/* 共通フィールド */}
					<div className="grid grid-cols-2 gap-4">
						<Input
							label={t("reservation.field.confirmationNumber")}
							value={reservation.confirmation_number || ""}
							onChange={(e) =>
								setReservation((prev: any) => ({
									...prev,
									confirmation_number: e.target.value,
								}))
							}
							placeholder={t("reservation.placeholder.confirmationNumber")}
						/>
						<Select
							label={t("reservation.field.reservationSite")}
							value={reservation.reservation_site || ""}
							onChange={(e) =>
								setReservation((prev: any) => ({
									...prev,
									reservation_site: e.target.value as ReservationSite,
								}))
							}
							options={[
								{ value: "", label: t("reservation.selectSite") },
								...getReservationSites().map((site) => ({
									value: site.value,
									label: site.label,
								})),
							]}
						/>
					</div>

					<Input
						label={t("reservation.field.reservationUrl")}
						value={reservation.reservation_url || ""}
						onChange={(e) =>
							setReservation((prev: any) => ({
								...prev,
								reservation_url: e.target.value,
							}))
						}
						placeholder="https://example.com"
						type="url"
					/>

					<Textarea
						label={t("reservation.field.notes")}
						value={reservation.notes || ""}
						onChange={(e) =>
							setReservation((prev: any) => ({
								...prev,
								notes: e.target.value,
							}))
						}
						placeholder={t("reservation.placeholder.notes")}
						rows={3}
					/>
				</div>

				{/* ボタン */}
				<div className="flex justify-end space-x-3 mt-6">
					<Button onClick={onClose} variant="outline" disabled={isSaving}>
						{t("reservation.button.cancel")}
					</Button>
					<Button onClick={handleSave} disabled={isSaving || isLoading}>
						{isSaving
							? t("reservation.button.saving")
							: t("reservation.button.save")}
					</Button>
				</div>
			</div>
		</div>
	);

	if (!mounted) return null;

	return (
		<>
			{createPortal(modal, document.body)}
			{showTemplateModal && (
				<ReservationTemplateModal
					isOpen={showTemplateModal}
					onClose={() => {
						setShowTemplateModal(false);
						setShowSaveAsTemplateModal(false);
					}}
					onSelectTemplate={handleLoadTemplate}
					reservationType={reservation.type}
					initialData={showSaveAsTemplateModal ? reservation : undefined}
				/>
			)}
		</>
	);
}
