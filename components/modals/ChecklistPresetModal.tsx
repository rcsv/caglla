"use client";

import { useState } from "react";
import { ChecklistItem } from "@/lib/core/types";
import { t } from "@/lib/i18n";

interface ChecklistPresetModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentItems: ChecklistItem[];
	onSuccess?: () => void;
}

export default function ChecklistPresetModal({
	isOpen,
	onClose,
	currentItems,
	onSuccess,
}: ChecklistPresetModalProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState("");
	const [isPublic, setIsPublic] = useState(false);
	const [saving, setSaving] = useState(false);

	if (!isOpen) return null;

	const handleSave = async () => {
		if (!title.trim()) {
			alert(t("checklist.preset.saveModal.titleRequired"));
			return;
		}

		try {
			setSaving(true);

			// カスタムフラグを削除してプリセット用のアイテムに変換
			const presetItems = currentItems.map((item) => ({
				title: item.title,
				description: item.description,
				category: item.category,
				priority: item.priority,
			}));

			const response = await fetch("/api/checklists/presets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					description,
					tags: tags
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean),
					items: presetItems,
					is_public: isPublic,
				}),
			});

			if (response.ok) {
				onSuccess?.();
				onClose();
				setTitle("");
				setDescription("");
				setTags("");
				setIsPublic(false);
			} else {
				alert(t("checklist.preset.saveModal.saveFailed"));
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-float-modal">
			<div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 zidx-float-modal-content">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">
					{t("checklist.preset.saveModal.title")}
				</h2>

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							{t("checklist.preset.saveModal.titleLabel")}
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("checklist.preset.saveModal.titlePlaceholder")}
							className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							{t("checklist.preset.saveModal.descriptionLabel")}
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t(
								"checklist.preset.saveModal.descriptionPlaceholder",
							)}
							rows={3}
							className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							{t("checklist.preset.saveModal.tagsLabel")}
						</label>
						<input
							type="text"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							placeholder={t("checklist.preset.saveModal.tagsPlaceholder")}
							className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="is_public"
							checked={isPublic}
							onChange={(e) => setIsPublic(e.target.checked)}
							className="w-4 h-4"
						/>
						<label htmlFor="is_public" className="text-sm text-gray-700">
							{t("checklist.preset.saveModal.isPublic")}
						</label>
					</div>
				</div>

				<div className="flex items-center gap-2 mt-6">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
					>
						{t("checklist.preset.saveModal.cancel")}
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
					>
						{saving
							? t("checklist.preset.saveModal.saving")
							: t("checklist.preset.saveModal.save")}
					</button>
				</div>
			</div>
		</div>
	);
}
