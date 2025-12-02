"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Trip } from "@/lib/core/types";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import Button from "@/components/common/Button";
import { Icon } from "@iconify/react";
import { useSubscription } from "@/lib/contexts/subscription";
import { t } from "@/lib/i18n";

interface ICalPublishModalProps {
	isOpen: boolean;
	onClose: () => void;
	trip: Trip;
	onUpdate?: (trip: Trip) => void;
}

export default function ICalPublishModal({
	isOpen,
	onClose,
	trip,
	onUpdate,
}: ICalPublishModalProps) {
	const { userPlan } = useSubscription();
	const [isLoading, setIsLoading] = useState(false);
	const [icalUrls, setICalUrls] = useState<{
		trip: string;
		reservations: string;
	} | null>(null);
	const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const isBackpackerOrHigher = userPlan !== "season_traveler";

	useEffect(() => {
		if (isOpen && trip.ical_enabled && trip.ical_public_token) {
			// 既存のトークンからURLを生成
			const baseUrl = window.location.origin;
			setICalUrls({
				trip: `${baseUrl}/api/trips/${trip.id}/ical?token=${trip.ical_public_token}&type=trip`,
				reservations: `${baseUrl}/api/trips/${trip.id}/ical?token=${trip.ical_public_token}&type=reservations`,
			});
		}
	}, [isOpen, trip]);

	if (!isOpen) return null;

	const handleEnable = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const res = await makeAuthenticatedRequest(
				`/api/trips/${trip.id}/ical-token`,
				{
					method: "POST",
				},
			);

			if (!res.ok) {
				// エラー本文から詳細を取得
				try {
					const data = await res.json();
					if (data?.required_plan) {
						setError(t("ical.planRequired"));
					} else if (data?.error) {
						setError(data.error);
					} else {
						setError(t("ical.enableError"));
					}
				} catch {
					setError(t("ical.enableError"));
				}
				setIsLoading(false);
				return;
			}

			const data: {
				success: boolean;
				token: string;
				urls: { trip: string; reservations: string };
			} = await res.json();

			setICalUrls(data.urls);

			// Tripを更新
			if (onUpdate) {
				onUpdate({
					...trip,
					ical_public_token: data.token,
					ical_enabled: true,
				});
			}

			setIsLoading(false);
		} catch (error) {
			console.error("Enable iCal error:", error);
			setError(t("ical.enableError"));
			setIsLoading(false);
		}
	};

	const handleDisable = async () => {
		if (!confirm(t("ical.disableConfirm"))) {
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const res = await makeAuthenticatedRequest(
				`/api/trips/${trip.id}/ical-token`,
				{
					method: "DELETE",
				},
			);

			if (!res.ok) {
				try {
					const data = await res.json();
					setError(data?.error || t("ical.disableError"));
				} catch {
					setError(t("ical.disableError"));
				}
				setIsLoading(false);
				return;
			}

			setICalUrls(null);

			// Tripを更新
			if (onUpdate) {
				onUpdate({
					...trip,
					ical_enabled: false,
				});
			}

			setIsLoading(false);
		} catch (error) {
			console.error("Disable iCal error:", error);
			setError(t("ical.disableError"));
			setIsLoading(false);
		}
	};

	const handleCopyUrl = (url: string, label: string) => {
		navigator.clipboard.writeText(url);
		setCopiedUrl(label);
		setTimeout(() => setCopiedUrl(null), 2000);
	};

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const modalContent = (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center zidx-float-modal p-4"
			onClick={handleBackdropClick}
		>
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* ヘッダー */}
				<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
					<h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
						<Icon icon="mdi:calendar-sync" className="w-6 h-6 text-blue-600" />
						{t("ical.title")}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
						aria-label={t("ical.close")}
					>
						<Icon icon="mdi:close" className="w-6 h-6" />
					</button>
				</div>

				{/* コンテンツ */}
				<div className="px-6 py-4 space-y-6">
					{/* プラン制限メッセージ */}
					{!isBackpackerOrHigher && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div className="flex items-start gap-2">
								<Icon
									icon="mdi:lock"
									className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
								/>
								<div>
									<p className="text-sm font-medium text-yellow-900">
										{t("ical.premiumFeature")}
									</p>
									<p className="text-sm text-yellow-800 mt-1">
										{t("ical.premiumFeatureDescription")}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* 説明 */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div className="flex items-start gap-2">
							<Icon
								icon="mdi:information"
								className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
							/>
							<div className="text-sm text-blue-900">
								<p className="font-medium mb-2">{t("ical.about.title")}</p>
								<ul className="list-disc list-inside space-y-1">
									<li>{t("ical.about.li1")}</li>
									<li>{t("ical.about.li2")}</li>
									<li>{t("ical.about.li3")}</li>
									<li>{t("ical.about.li4")}</li>
								</ul>
							</div>
						</div>
					</div>

					{/* エラーメッセージ */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="flex items-start gap-2">
								<Icon
									icon="mdi:alert-circle"
									className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
								/>
								<p className="text-sm text-red-900">{error}</p>
							</div>
						</div>
					)}

					{/* 公開状態 */}
					{trip.ical_enabled && icalUrls ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
								<div className="flex items-center gap-2">
									<Icon
										icon="mdi:check-circle"
										className="w-5 h-5 text-green-600"
									/>
									<span className="text-sm font-medium text-green-900">
										{t("ical.enabled")}
									</span>
								</div>
								<Button
									onClick={handleDisable}
									variant="secondary"
									disabled={isLoading}
									className="text-sm"
								>
									{t("ical.disable")}
								</Button>
							</div>

							{/* iCal URL */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									{t("ical.tripUrl")}
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={icalUrls.trip}
										readOnly
										className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
										onClick={(e) => (e.target as HTMLInputElement).select()}
									/>
									<Button
										onClick={() => handleCopyUrl(icalUrls.trip, "trip")}
										variant="secondary"
										className="flex items-center gap-2"
									>
										{copiedUrl === "trip" ? (
											<>
												<Icon icon="mdi:check" className="w-5 h-5" />
												{t("ical.copied")}
											</>
										) : (
											<>
												<Icon icon="mdi:content-copy" className="w-5 h-5" />
												{t("ical.copy")}
											</>
										)}
									</Button>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									{t("ical.reservationsUrl")}
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={icalUrls.reservations}
										readOnly
										className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
										onClick={(e) => (e.target as HTMLInputElement).select()}
									/>
									<Button
										onClick={() =>
											handleCopyUrl(icalUrls.reservations, "reservations")
										}
										variant="secondary"
										className="flex items-center gap-2"
									>
										{copiedUrl === "reservations" ? (
											<>
												<Icon icon="mdi:check" className="w-5 h-5" />
												{t("ical.copied")}
											</>
										) : (
											<>
												<Icon icon="mdi:content-copy" className="w-5 h-5" />
												{t("ical.copy")}
											</>
										)}
									</Button>
								</div>
							</div>

							{/* 使い方 */}
							<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
								<p className="text-sm font-medium text-gray-900 mb-2">
									{t("ical.addToCalendar.title")}
								</p>
								<ul className="text-sm text-gray-700 space-y-1">
									<li>
										<strong>Google Calendar:</strong>{" "}
										{t("ical.addToCalendar.google")}
									</li>
									<li>
										<strong>Apple Calendar:</strong>{" "}
										{t("ical.addToCalendar.apple")}
									</li>
									<li>
										<strong>Outlook:</strong> {t("ical.addToCalendar.outlook")}
									</li>
								</ul>
							</div>
						</div>
					) : (
						<div className="text-center py-8">
							<Icon
								icon="mdi:calendar-remove"
								className="w-16 h-16 text-gray-400 mx-auto mb-4"
							/>
							<p className="text-gray-600 mb-4">{t("ical.disabled")}</p>
							<Button
								onClick={handleEnable}
								variant="primary"
								disabled={isLoading || !isBackpackerOrHigher}
								className="flex items-center gap-2 mx-auto"
							>
								{isLoading ? (
									<>
										<Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
										{t("ical.enabling")}
									</>
								) : (
									<>
										<Icon icon="mdi:calendar-sync" className="w-5 h-5" />
										{t("ical.enable")}
									</>
								)}
							</Button>
						</div>
					)}
				</div>

				{/* フッター */}
				<div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
					<Button onClick={onClose} variant="secondary">
						{t("ical.closeButton")}
					</Button>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
