"use client";

import { useEffect, useState, useCallback } from "react";
import { ChecklistPreset } from "@/lib/core/types";
import { useAuth } from "@/lib/contexts/auth";
import { t } from "@/lib/i18n";

interface PresetLibraryModalProps {
	isOpen: boolean;
	onClose: () => void;
	tripId: string;
	onApply?: () => void;
}

export default function PresetLibraryModal({
	isOpen,
	onClose,
	tripId,
	onApply,
}: PresetLibraryModalProps) {
	const { getIdToken } = useAuth();
	const [presets, setPresets] = useState<ChecklistPreset[]>([]);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<"popular" | "recent">("popular");

	const fetchPresets = useCallback(async () => {
		try {
			setLoading(true);
			const token = await getIdToken();
			const response = await fetch(
				`/api/checklists/presets?query=${encodeURIComponent(query)}&sort=${sort}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			if (response.ok) {
				const data = await response.json();
				setPresets(data.presets || []);
			}
		} finally {
			setLoading(false);
		}
	}, [getIdToken, query, sort]);

	useEffect(() => {
		if (isOpen) {
			void fetchPresets();
		}
	}, [isOpen, fetchPresets]);

	const applyPreset = async (presetId: string) => {
		try {
			const token = await getIdToken();
			const response = await fetch(
				`/api/trips/${tripId}/checklist/apply-preset`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ preset_id: presetId }),
				},
			);

			if (response.ok) {
				onApply?.();
				onClose();
			} else {
				alert(t("checklist.library.applyFailed"));
			}
		} catch (error) {
			alert(t("checklist.library.applyFailed"));
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-float-modal">
			<div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col p-6 zidx-float-modal-content">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">
					{t("checklist.library.title")}
				</h2>

				<div className="flex items-center gap-2 mb-4">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t("checklist.library.searchPlaceholder")}
						className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<select
						value={sort}
						onChange={(e) => setSort(e.target.value as "popular" | "recent")}
						className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="popular">
							{t("checklist.library.sortPopular")}
						</option>
						<option value="recent">{t("checklist.library.sortRecent")}</option>
					</select>
				</div>

				<div className="flex-1 overflow-y-auto space-y-3">
					{loading ? (
						<div className="text-gray-500">
							{t("checklist.library.loading")}
						</div>
					) : presets.length === 0 ? (
						<div className="text-gray-500">{t("checklist.library.empty")}</div>
					) : (
						presets.map((preset) => (
							<div key={preset.id} className="border rounded-lg p-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="font-medium text-gray-900">
											{preset.title}
										</h3>
										{preset.description && (
											<p className="text-sm text-gray-600 mt-1">
												{preset.description}
											</p>
										)}
										{preset.tags && preset.tags.length > 0 && (
											<div className="flex flex-wrap gap-1 mt-2">
												{preset.tags.map((tag) => (
													<span
														key={tag}
														className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
													>
														{tag}
													</span>
												))}
											</div>
										)}
										<div className="text-xs text-gray-500 mt-2">
											{t("checklist.myPresets.usageCount")}:{" "}
											{preset.usage_count || 0}
											{t("checklist.myPresets.itemsCount")} •
											{preset.items?.length || 0}
											{t("checklist.myPresets.itemsCount")}
										</div>
									</div>
									<button
										onClick={() => applyPreset(preset.id)}
										className="ml-4 px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
									>
										{t("checklist.library.apply")}
									</button>
								</div>
							</div>
						))
					)}
				</div>

				<div className="flex justify-end mt-6">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
					>
						{t("checklist.library.close")}
					</button>
				</div>
			</div>
		</div>
	);
}
