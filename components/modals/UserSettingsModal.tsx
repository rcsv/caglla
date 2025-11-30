"use client";
import logger from "@/lib/core/logger";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth";
import PlaceSearchInput from "@/components/common/PlaceSearchInput";
import type { PlaceData } from "@/lib/core/types";
import AvatarUpload from "@/components/ui/AvatarUpload";
import { getZIndexClass } from "@/lib/core/z-index";
import type {
	User,
	UserPreferences,
	UserSettingsModalProps,
	UnitSystem,
} from "@/lib/core/types";
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "@/lib/utils/language";
import { CloseIcon } from "@/components/common/icons/CloseIcon";
import { t } from "@/lib/i18n";
import { getDefaultUnitSystem } from "@/lib/utils/unit-system";

export default function UserSettingsModal({
	isOpen,
	onClose,
}: UserSettingsModalProps) {
	const { user } = useAuth();
	const [userData, setUserData] = useState<User | null>(null);
	const [preferences, setPreferences] = useState<UserPreferences>({});
	const [saving, setSaving] = useState(false);
	const [nameError, setNameError] = useState<string | null>(null);
	const [nameSuccess, setNameSuccess] = useState<string | null>(null);
	const [isCheckingSlug, setIsCheckingSlug] = useState(false);
	const [hasUserInteracted, setHasUserInteracted] = useState(false);
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const fetchUserData = useCallback(async () => {
		try {
			const response = await fetch("/api/users", {
				headers: {
					Authorization: `Bearer ${await user?.getIdToken()}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setUserData(data.user);
				const userPreferences = data.user.preferences || {};
				// unit_systemが未設定の場合、home_country_codeに基づいて自動設定
				if (!userPreferences.unit_system) {
					userPreferences.unit_system = getDefaultUnitSystem(
						userPreferences.home_country_code,
					);
				}
				setPreferences(userPreferences);
			}
		} catch (error) {
			logger.error("Failed to fetch user data:", error);
		}
	}, [user]);

	useEffect(() => {
		if (isOpen && user) {
			fetchUserData();
			// モーダルが開かれた時に状態をリセット
			setNameError(null);
			setNameSuccess(null);
			setHasUserInteracted(false);
		}
	}, [isOpen, user, fetchUserData]);

	const checkSlugAvailability = async (name: string) => {
		if (!name.trim()) {
			setNameError(null);
			setNameSuccess(null);
			return;
		}

		// 3文字以下の場合はエラー
		if (name.trim().length <= 3) {
			setNameError(t("userSettings.validation.nameMinLength"));
			setNameSuccess(null);
			return;
		}

		setIsCheckingSlug(true);
		setNameError(null);
		setNameSuccess(null);

		try {
			const response = await fetch("/api/users/check-slug", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await user?.getIdToken()}`,
				},
				body: JSON.stringify({ name }),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.isAvailable) {
					setNameSuccess(t("userSettings.validation.nameAvailable"));
				} else {
					setNameError(data.message);
				}
			} else {
				setNameError(t("userSettings.validation.slugCheckFailed"));
			}
		} catch (error) {
			logger.error("Failed to check slug availability:", error);
			setNameError(t("userSettings.validation.slugCheckFailed"));
		} finally {
			setIsCheckingSlug(false);
		}
	};

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newName = e.target.value;
		setUserData((prev) => (prev ? { ...prev, name: newName } : null));

		// 既存のタイムアウトをクリア
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// ユーザーが入力したことを記録
		setHasUserInteracted(true);

		// デバウンス処理は行わない（フォーカス外れまで待機）
	};

	const handleNameBlur = () => {
		// フォーカスが外れた時のみチェッカーを起動
		if (hasUserInteracted && userData?.name) {
			checkSlugAvailability(userData.name);
		}
	};

	const handleSave = async () => {
		// エラーがある場合は保存を阻止
		if (nameError) {
			alert(t("userSettings.validation.nameDuplicate"));
			return;
		}

		setSaving(true);
		try {
			logger.debug("Saving user data:", {
				name: userData?.name,
				email: userData?.email,
				profile_image_url: userData?.profile_image_url,
				preferences,
			});

			const response = await fetch("/api/users", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await user?.getIdToken()}`,
				},
				body: JSON.stringify({
					name: userData?.name,
					email: userData?.email,
					profile_image_url: userData?.profile_image_url,
					preferences,
				}),
			});

			logger.debug("Save response status:", response.status);

			if (response.ok) {
				const data = await response.json();
				logger.debug("Save successful:", data);
				setUserData(data.user);
				alert(t("userSettings.success.saved"));
				onClose(); // ダイアログを閉じる
			} else {
				const errorData = await response.json().catch(() => ({}));
				logger.error("Save failed:", response.status, errorData);
				const errorMsg = errorData.error || t("userSettings.error.unknown");
				alert(t("userSettings.error.saveFailed").replace("{error}", errorMsg));
			}
		} catch (error) {
			logger.error("Failed to save preferences:", error);
			alert(t("userSettings.error.saveFailedNetwork"));
		} finally {
			setSaving(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className={`fixed inset-0 overflow-y-auto ${getZIndexClass("USER_SETTINGS")}`}
		>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="flex min-h-full items-center justify-center p-4">
				<div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b">
						<h2 className="text-2xl font-bold text-gray-900">
							{t("userSettings.title")}
						</h2>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600 transition-colors"
							aria-label={t("common.close")}
						>
							<CloseIcon className="w-6 h-6" />
						</button>
					</div>

					{/* Content */}
					<div className="p-6 space-y-6">
						{/* Basic Info */}
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								{t("userSettings.basicInfo")}
							</h3>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700">
										{t("userSettings.label.name")}
									</label>
									<input
										type="text"
										value={userData?.name || ""}
										onChange={handleNameChange}
										onBlur={handleNameBlur}
										className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
											nameError
												? "border-red-300 bg-red-50 focus:ring-red-500"
												: nameSuccess
													? "border-green-300 bg-green-50 focus:ring-green-500"
													: "border-gray-300 focus:ring-blue-500"
										}`}
										placeholder={t("userSettings.placeholder.name")}
										disabled={saving || isCheckingSlug}
									/>
									{isCheckingSlug && (
										<p className="mt-1 text-xs text-blue-600">
											{t("userSettings.description.checkingSlug")}
										</p>
									)}
									{nameError && (
										<p className="mt-1 text-xs text-red-600">{nameError}</p>
									)}
									{nameSuccess && !isCheckingSlug && (
										<p className="mt-1 text-xs text-green-600">{nameSuccess}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700">
										{t("userSettings.label.email")}
									</label>
									<p className="mt-1 text-sm text-gray-900">
										{userData?.email || t("loading.message")}
									</p>
								</div>
								{userData && (
									<div>
										<AvatarUpload
											currentImageUrl={userData.profile_image_url}
											onImageChange={(imageUrl) =>
												setUserData((prev) =>
													prev
														? {
																...prev,
																profile_image_url: imageUrl || undefined,
															}
														: null,
												)
											}
											userId={userData.id}
											disabled={saving}
										/>
									</div>
								)}
							</div>
						</div>

						{/* Preferences */}
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								{t("userSettings.settings")}
							</h3>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700">
										{t("userSettings.label.currency")}
									</label>
									<input
										type="text"
										value={preferences.currency || ""}
										onChange={(e) =>
											setPreferences((prev) => ({
												...prev,
												currency: e.target.value,
											}))
										}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										placeholder={t("userSettings.placeholder.currency")}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										{t("userSettings.label.homeArea")}
									</label>
									<PlaceSearchInput
										currentPlace={
											preferences.home_place_id && preferences.home_address
												? ({
														place_id: preferences.home_place_id,
														name: preferences.home_address,
														formatted_address: preferences.home_address,
														geometry: { location: { lat: 0, lng: 0 } },
													} as unknown as PlaceData)
												: undefined
										}
										onPlaceSelect={async (place: PlaceData | null) => {
											setPreferences((prev) => ({
												...prev,
												home_place_id: place?.place_id,
												home_address: place?.name || "",
											}));

											// 場所が選択された場合、詳細情報を取得して国コードを抽出
											if (place?.place_id) {
												try {
													const response = await fetch("/api/places/details", {
														method: "POST",
														headers: { "Content-Type": "application/json" },
														body: JSON.stringify({ placeId: place.place_id }),
													});

													if (response.ok) {
														const data = await response.json();
														const addressComponents =
															data.result?.address_components;
														if (addressComponents) {
															const countryComponent = addressComponents.find(
																(comp: any) => comp.types.includes("country"),
															);
															if (countryComponent?.short_name) {
																setPreferences((prev) => ({
																	...prev,
																	home_country_code:
																		countryComponent.short_name,
																}));
															}
														}
													}
												} catch (error) {
													logger.error(
														"Failed to get place details for country code:",
														error,
													);
												}
											} else {
												// 場所がクリアされた場合、国コードもクリア
												setPreferences((prev) => ({
													...prev,
													home_country_code: "",
												}));
											}
										}}
										placeholder={t("userSettings.placeholder.homeArea")}
										disabled={saving}
									/>
									<p className="mt-1 text-xs text-gray-500">
										{t("userSettings.description.homeAreaCountryCode")}
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										{t("userSettings.label.homeCountry")}
									</label>
									<select
										value={preferences.home_country_code || ""}
										onChange={(e) => {
											const countryCode = e.target.value;
											const defaultUnitSystem = getDefaultUnitSystem(
												countryCode || null,
											);
											setPreferences((prev) => ({
												...prev,
												home_country_code: countryCode,
												// 国コードが変更された場合、unit_systemが未設定なら自動設定
												unit_system: prev.unit_system || defaultUnitSystem,
											}));
										}}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="">
											{t("userSettings.placeholder.select")}
										</option>
										<option value="JP">{t("country.JP")}</option>
										<option value="US">{t("country.US")}</option>
										<option value="CA">{t("country.CA")}</option>
										<option value="AU">{t("country.AU")}</option>
										<option value="NZ">{t("country.NZ")}</option>
										<option value="GB">{t("country.GB")}</option>
										<option value="DE">{t("country.DE")}</option>
										<option value="FR">{t("country.FR")}</option>
										<option value="IT">{t("country.IT")}</option>
										<option value="ES">{t("country.ES")}</option>
										<option value="KR">{t("country.KR")}</option>
										<option value="CN">{t("country.CN")}</option>
										<option value="TW">{t("country.TW")}</option>
										<option value="HK">{t("country.HK")}</option>
										<option value="SG">{t("country.SG")}</option>
										<option value="TH">{t("country.TH")}</option>
										<option value="MY">{t("country.MY")}</option>
										<option value="ID">{t("country.ID")}</option>
										<option value="PH">{t("country.PH")}</option>
										<option value="VN">{t("country.VN")}</option>
										<option value="IN">{t("country.IN")}</option>
									</select>
									<p className="mt-1 text-xs text-gray-500">
										{t("userSettings.description.homeCountry")}
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										{t("userSettings.label.unitSystem")}
									</label>
									<select
										value={
											preferences.unit_system ||
											getDefaultUnitSystem(preferences.home_country_code)
										}
										onChange={(e) =>
											setPreferences((prev) => ({
												...prev,
												unit_system: e.target.value as UnitSystem,
											}))
										}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="metric">
											{t("userSettings.unitSystem.metric")}
										</option>
										<option value="imperial">
											{t("userSettings.unitSystem.imperial")}
										</option>
									</select>
									<p className="mt-1 text-xs text-gray-500">
										{t("userSettings.description.unitSystem")}
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										{t("userSettings.label.timezone")}
									</label>
									<input
										type="text"
										value={preferences.timezone || ""}
										onChange={(e) =>
											setPreferences((prev) => ({
												...prev,
												timezone: e.target.value,
											}))
										}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										placeholder={t("userSettings.placeholder.timezone")}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										{t("userSettings.label.language")}
									</label>
									<select
										value={preferences.language || ""}
										onChange={(e) =>
											setPreferences((prev) => ({
												...prev,
												language: e.target.value,
											}))
										}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="">
											{t("userSettings.placeholder.languageAuto")}
										</option>
										{SUPPORTED_LANGUAGES.map((lang) => (
											<option key={lang} value={lang}>
												{LANGUAGE_NAMES[lang].native} /{" "}
												{LANGUAGE_NAMES[lang].en} ({lang})
											</option>
										))}
									</select>
									<p className="mt-1 text-xs text-gray-500">
										{t("userSettings.description.language")}
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700">
										{t("userSettings.label.theme")}
									</label>
									<select
										value={preferences.theme || "light"}
										onChange={(e) =>
											setPreferences((prev) => ({
												...prev,
												theme: e.target.value as "light" | "dark",
											}))
										}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="light">
											{t("userSettings.theme.light")}
										</option>
										<option value="dark">{t("userSettings.theme.dark")}</option>
									</select>
								</div>

								<div className="flex items-center">
									<input
										type="checkbox"
										id="notifications"
										checked={preferences.notifications || false}
										onChange={(e) =>
											setPreferences((prev) => ({
												...prev,
												notifications: e.target.checked,
											}))
										}
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
									<label
										htmlFor="notifications"
										className="ml-2 block text-sm text-gray-700"
									>
										{t("userSettings.label.notifications")}
									</label>
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
						<button
							onClick={onClose}
							className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{t("userSettings.button.cancel")}
						</button>
						<button
							onClick={handleSave}
							disabled={saving || isCheckingSlug || !!nameError}
							className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{saving
								? t("userSettings.button.saving")
								: t("userSettings.button.save")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
