"use client";

import type { ChecklistItem } from "@/lib/core/types";
import { resolveChecklistItemText } from "@/lib/utils/checklist-i18n";
import { t } from "@/lib/i18n";

interface ChecklistItemRowProps {
	item: ChecklistItem;
	isSelected: boolean;
	readOnly: boolean;
	onClick: () => void;
	onToggle: (id: string) => void;
	onRemove?: (id: string) => void;
}

export function ChecklistItemRow({
	item,
	isSelected,
	readOnly,
	onClick,
	onToggle,
	onRemove,
}: ChecklistItemRowProps) {
	const resolved = resolveChecklistItemText(
		item,
		item.generatedFrom,
		item.itemKey,
	);

	return (
		<li
			className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors ${
				isSelected ? "bg-blue-50 border border-blue-200" : ""
			}`}
			onClick={onClick}
		>
			<input
				type="checkbox"
				className="w-4 h-4 flex-shrink-0"
				checked={!!item.done}
				onChange={(e) => {
					e.stopPropagation();
					onToggle(item.id);
				}}
				disabled={readOnly}
			/>
			<div
				className={`flex-1 min-w-0 ${
					item.done ? "text-gray-400 opacity-60" : "text-gray-800"
				}`}
			>
				<div className="font-medium">{resolved.title}</div>
				{resolved.description && (
					<div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
						{resolved.description}
					</div>
				)}
			</div>
			{/* 優先度バッジ（右端に寄せる） */}
			<div className="flex items-center gap-1 ml-auto">
				{item.priority === "high" && (
					<span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
						{t("checklist.priority.high")}
					</span>
				)}
				{item.priority === "medium" && (
					<span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
						{t("checklist.priority.medium")}
					</span>
				)}
				{item.priority === "low" && (
					<span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
						{t("checklist.priority.low")}
					</span>
				)}
				{/* リンク存在インジケーター（クリック可能） */}
				{item.links && item.links.length > 0 && (
					<div className="flex items-center gap-1">
						{item.links.map((link, idx) => (
							<a
								key={idx}
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
								title={link.label}
								onClick={(e) => e.stopPropagation()}
							>
								🔗
							</a>
						))}
					</div>
				)}
				{item.isCustom && !readOnly && onRemove && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onRemove(item.id);
						}}
						className="text-xs text-gray-500 hover:text-red-600"
					>
						{t("checklist.delete")}
					</button>
				)}
			</div>
		</li>
	);
}

