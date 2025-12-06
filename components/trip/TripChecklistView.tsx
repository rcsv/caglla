"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import PresetLibraryModal from "@/components/modals/PresetLibraryModal";
import { ChecklistProvider, useChecklist } from "./ChecklistContext";
import { ChecklistSidebar } from "./ChecklistSidebar";
import { ChecklistDetailPanel } from "./ChecklistDetailPanel";

interface TripChecklistViewProps {
	tripId?: string;
	readOnly?: boolean;
}

interface TripChecklistViewContentProps {
	tripId?: string;
}

function TripChecklistViewContent({ tripId }: TripChecklistViewContentProps) {
	const { loading, saving, readOnly, regenerate, addCustom, refresh } =
		useChecklist();
	const [showLibraryModal, setShowLibraryModal] = useState(false);
	const [input, setInput] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<
		"preparation" | "packing"
	>("packing");

	const handleAddCustom = () => {
		addCustom(input, selectedCategory);
		setInput("");
	};

	const handlePresetApply = async () => {
		// プリセット適用成功時、チェックリストを再取得
		await refresh();
		setShowLibraryModal(false);
	};

	return (
		<div className="px-4 py-4">
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="p-4 flex items-center justify-between flex-wrap gap-2">
					<h2 className="text-lg font-semibold text-gray-900">
						{t("checklist.title")}
						{readOnly && (
							<span className="ml-2 text-xs text-gray-500">
								({t("common.readOnly")})
							</span>
						)}
					</h2>
					{!readOnly && (
						<div className="flex items-center gap-2 flex-wrap">
							<button
								type="button"
								onClick={() => setShowLibraryModal(true)}
								className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
							>
								{t("checklist.applyPreset")}
							</button>
							<button
								type="button"
								onClick={regenerate}
								disabled={saving}
								className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
							>
								{saving
									? t("checklist.regenerating")
									: t("checklist.regenerate")}
							</button>
						</div>
					)}
				</div>

				{/* カスタム項目追加 */}
				{!loading && !readOnly && (
					<div className="px-4 pb-4 border-b border-gray-200">
						<div className="flex items-center gap-2">
							<select
								value={selectedCategory}
								onChange={(e) =>
									setSelectedCategory(
										e.target.value as "preparation" | "packing",
									)
								}
								className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="preparation">Preparing</option>
								<option value="packing">Packing</option>
							</select>
							<input
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
								placeholder={t("checklist.addCustom.placeholder")}
								className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								type="button"
								onClick={handleAddCustom}
								className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900"
							>
								{t("checklist.addCustom.add")}
							</button>
						</div>
					</div>
				)}

				{loading ? (
					<div className="p-4 text-gray-500">{t("checklist.loading")}</div>
				) : (
					<div className="flex flex-col lg:flex-row gap-4 p-4 h-[calc(100vh-300px)]">
						<ChecklistSidebar />
						<ChecklistDetailPanel />
					</div>
				)}
			</div>

			{/* モーダル */}
			<PresetLibraryModal
				isOpen={showLibraryModal}
				onClose={() => setShowLibraryModal(false)}
				tripId={tripId || ""}
				onApply={handlePresetApply}
			/>
		</div>
	);
}

export default function TripChecklistView({
	tripId,
	readOnly = false,
}: TripChecklistViewProps) {
	return (
		<ChecklistProvider tripId={tripId} readOnly={readOnly}>
			<TripChecklistViewContent tripId={tripId} />
		</ChecklistProvider>
	);
}
