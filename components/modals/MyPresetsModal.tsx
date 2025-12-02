"use client";

import { useEffect, useState, useCallback } from "react";
import { ChecklistPreset } from "@/lib/core/types";
import { useAuth } from "@/lib/contexts/auth";
import { t } from "@/lib/i18n";

interface MyPresetsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function MyPresetsModal({
	isOpen,
	onClose,
}: MyPresetsModalProps) {
	const { getIdToken } = useAuth();
	const [presets, setPresets] = useState<ChecklistPreset[]>([]);
	const [loading, setLoading] = useState(false);

	const fetchMyPresets = useCallback(async () => {
		try {
			setLoading(true);
			const token = await getIdToken();
			const response = await fetch("/api/checklists/presets?user_id=current", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setPresets(data.presets || []);
			}
		} finally {
			setLoading(false);
		}
	}, [getIdToken]);

	useEffect(() => {
		if (isOpen) {
			void fetchMyPresets();
		}
	}, [isOpen, fetchMyPresets]);

	const deletePreset = async (presetId: string) => {
		if (!confirm(t("checklist.myPresets.deleteConfirm"))) return;

		try {
			const token = await getIdToken();
			const response = await fetch(`/api/checklists/presets/${presetId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				setPresets((prev) => prev.filter((p) => p.id !== presetId));
			}
		} catch (error) {
			alert(t("checklist.myPresets.deleteFailed"));
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center zidx-float-modal">
			<div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 zidx-float-modal-content">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">
					{t("checklist.myPresets.title")}
				</h2>

				{loading ? (
					<div className="text-gray-500">
						{t("checklist.myPresets.loading")}
					</div>
				) : presets.length === 0 ? (
					<div className="text-gray-500">{t("checklist.myPresets.empty")}</div>
				) : (
					<div className="space-y-3">
						{presets.map((preset) => (
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
											{preset.is_public
												? t("checklist.myPresets.public")
												: t("checklist.myPresets.private")}{" "}
											•{t("checklist.myPresets.usageCount")}:{" "}
											{preset.usage_count || 0}
											{t("checklist.myPresets.itemsCount")} •
											{preset.items?.length || 0}
											{t("checklist.myPresets.itemsCount")}
										</div>
									</div>
									<button
										onClick={() => deletePreset(preset.id)}
										className="ml-4 text-xs text-red-600 hover:text-red-800"
									>
										{t("checklist.myPresets.delete")}
									</button>
								</div>
							</div>
						))}
					</div>
				)}

				<div className="flex justify-end mt-6">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
					>
						{t("checklist.myPresets.close")}
					</button>
				</div>
			</div>
		</div>
	);
}
