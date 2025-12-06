"use client";

import { useEffect, useState } from "react";
import { IconRenderer } from "@/components/common/icons/IconRenderer";
import { t } from "@/lib/i18n";
import { useChecklist } from "./ChecklistContext";
import { useChecklistGrouping } from "@/hooks/useChecklistGrouping";
import { ChecklistItemRow } from "./ChecklistItemRow";
import {
	getSecondaryCategoryLabel,
	getPrimaryCategoryFromSecondary,
} from "@/lib/data/activity-categories";

export function ChecklistSidebar() {
	const {
		items,
		selectedItem,
		readOnly,
		setSelectedItem,
		toggle,
		removeItem,
	} = useChecklist();
	const { groupedPrepItems, groupedPackItems } = useChecklistGrouping(items);
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	// グループ名を取得するヘルパー関数
	const getGroupName = (secondaryCategory: string): string => {
		if (secondaryCategory === "custom") {
			return t("checklist.customItems") || "カスタム項目";
		}
		const primaryCategory = getPrimaryCategoryFromSecondary(secondaryCategory);
		if (!primaryCategory) {
			return t("checklist.unknownCategory") || "不明なカテゴリー";
		}
		return getSecondaryCategoryLabel(primaryCategory, secondaryCategory);
	};

	// アコーディオンの開閉
	const toggleGroup = (groupKey: string) => {
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) {
				next.delete(groupKey);
			} else {
				next.add(groupKey);
			}
			return next;
		});
	};

	// 初期状態: すべてのグループを展開
	useEffect(() => {
		if (items.length > 0 && expandedGroups.size === 0) {
			const allGroups = new Set([
				...Object.keys(groupedPrepItems),
				...Object.keys(groupedPackItems),
			]);
			setExpandedGroups(allGroups);
		}
	}, [items.length, groupedPrepItems, groupedPackItems, expandedGroups.size]);

	return (
		<div className="flex-1 lg:w-[40%] overflow-y-auto space-y-4">
			{/* Preparing セクション */}
			<div
				id="checklist-preparing"
				className="border border-gray-200 rounded-lg bg-white"
			>
				<div className="px-4 py-3 border-b bg-gray-50 text-sm font-semibold text-gray-900 flex items-center gap-2">
					<IconRenderer
						iconName="airplane"
						className="w-5 h-5"
						color="#3b82f6"
					/>
					{t("checklist.preparing.title")}
				</div>
				<div className="p-3 space-y-4">
					{Object.entries(groupedPrepItems).map(([groupKey, groupItems]) => {
						const isExpanded = expandedGroups.has(groupKey);
						const groupName = getGroupName(groupKey);
						return (
							<div
								key={groupKey}
								className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0"
							>
								<button
									onClick={() => toggleGroup(groupKey)}
									className="w-full flex items-center justify-between text-left text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2 px-1"
								>
									<div className="flex items-center gap-2">
										<span className="text-base">🏷️</span>
										<span>{groupName}</span>
										<span className="text-xs text-gray-500 font-normal">
											({groupItems.length})
										</span>
									</div>
									<svg
										className={`w-4 h-4 text-gray-500 transition-transform ${
											isExpanded ? "transform rotate-180" : ""
										}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>
								{isExpanded && (
									<ul className="space-y-2 ml-6">
										{groupItems.map((item) => (
											<ChecklistItemRow
												key={item.id}
												item={item}
												isSelected={selectedItem?.id === item.id}
												readOnly={readOnly}
												onClick={() => setSelectedItem(item)}
												onToggle={toggle}
												onRemove={removeItem}
											/>
										))}
									</ul>
								)}
							</div>
						);
					})}
					{Object.keys(groupedPrepItems).length === 0 && (
						<div className="text-sm text-gray-500 ml-6">
							{t("checklist.noItems")}
						</div>
					)}
				</div>
			</div>

			{/* Packing セクション */}
			<div
				id="checklist-packing"
				className="border border-gray-200 rounded-lg bg-white"
			>
				<div className="px-4 py-3 border-b bg-gray-50 text-sm font-semibold text-gray-900 flex items-center gap-2">
					<IconRenderer
						iconName="backpack"
						className="w-5 h-5"
						color="#ef4444"
					/>
					{t("checklist.packing.title")}
				</div>
				<div className="p-3 space-y-4">
					{Object.entries(groupedPackItems).map(([groupKey, groupItems]) => {
						const isExpanded = expandedGroups.has(groupKey);
						const groupName = getGroupName(groupKey);
						return (
							<div
								key={groupKey}
								className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0"
							>
								<button
									onClick={() => toggleGroup(groupKey)}
									className="w-full flex items-center justify-between text-left text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2 px-1"
								>
									<div className="flex items-center gap-2">
										<span className="text-base">🏷️</span>
										<span>{groupName}</span>
										<span className="text-xs text-gray-500 font-normal">
											({groupItems.length})
										</span>
									</div>
									<svg
										className={`w-4 h-4 text-gray-500 transition-transform ${
											isExpanded ? "transform rotate-180" : ""
										}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>
								{isExpanded && (
									<ul className="space-y-2 ml-6">
										{groupItems.map((item) => (
											<ChecklistItemRow
												key={item.id}
												item={item}
												isSelected={selectedItem?.id === item.id}
												readOnly={readOnly}
												onClick={() => setSelectedItem(item)}
												onToggle={toggle}
												onRemove={removeItem}
											/>
										))}
									</ul>
								)}
							</div>
						);
					})}
					{Object.keys(groupedPackItems).length === 0 && (
						<div className="text-sm text-gray-500 ml-6">
							{t("checklist.noItems")}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

