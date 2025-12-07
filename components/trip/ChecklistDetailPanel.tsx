"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { t } from "@/lib/i18n";
import { useChecklist } from "./ChecklistContext";
import { resolveChecklistItemText } from "@/lib/utils/checklist-i18n";
import {
	getSecondaryCategoryLabel,
	getPrimaryCategoryFromSecondary,
} from "@/lib/data/activity-categories";
import { useChecklistGrouping } from "@/hooks/useChecklistGrouping";

export function ChecklistDetailPanel() {
	const {
		items,
		selectedItem,
		readOnly,
		setSelectedItem,
		updateUserMemo,
	} = useChecklist();
	const { groupedPrepItems, groupedPackItems } = useChecklistGrouping(items);
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(["userMemo"]), // デフォルトでユーザーメモは展開
	);

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

	const toggleSection = (sectionKey: string) => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(sectionKey)) {
				next.delete(sectionKey);
			} else {
				next.add(sectionKey);
			}
			return next;
		});
	};

	if (!selectedItem) {
		return (
			<div className="p-4 h-full flex items-center justify-center text-gray-400">
				<div className="text-center">
					<svg
						className="w-12 h-12 mx-auto mb-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<p className="text-sm">{t("checklist.selectItem")}</p>
				</div>
			</div>
		);
	}

	const resolved = resolveChecklistItemText(
		selectedItem,
		selectedItem.generatedFrom,
		selectedItem.itemKey,
	);

	return (
		<div
			id="checklist-detail"
			className="hidden lg:block lg:w-[60%] border border-gray-200 rounded-lg bg-white overflow-y-auto flex flex-col"
		>
			{/* 固定ヘッダー */}
			<div className="flex-shrink-0 p-4 pb-3 border-b border-gray-200 bg-gray-50">
				{/* カテゴリ情報（クリック可能） */}
				<div className="mb-2">
					<div className="flex items-center gap-2 text-sm text-gray-600">
						<button
							type="button"
							onClick={() => {
								const targetId =
									selectedItem.category === "preparation"
										? "checklist-preparing"
										: "checklist-packing";
								const element = document.getElementById(targetId);
								if (element) {
									element.scrollIntoView({
										behavior: "smooth",
										block: "start",
									});
									// ハイライト効果
									element.classList.add("ring-2", "ring-blue-500");
									setTimeout(() => {
										element.classList.remove("ring-2", "ring-blue-500");
									}, 2000);
								}
							}}
							className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
						>
							{selectedItem.category === "preparation"
								? t("checklist.preparing.title")
								: t("checklist.packing.title")}
						</button>
						{selectedItem.generatedFrom && (
							<>
								<span className="text-gray-400">/</span>
								<span>{getGroupName(selectedItem.generatedFrom)}</span>
							</>
						)}
					</div>
				</div>
				{/* タイトル + 優先度 + 閉じるボタン */}
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							{resolved.title}
						</h3>
						{selectedItem.priority && (
							<span
								className={`px-2 py-1 text-xs rounded ${
									selectedItem.priority === "high"
										? "bg-red-100 text-red-700"
										: selectedItem.priority === "medium"
											? "bg-yellow-100 text-yellow-700"
											: "bg-gray-100 text-gray-700"
								}`}
							>
								{selectedItem.priority === "high"
									? t("checklist.priority.high")
									: selectedItem.priority === "medium"
										? t("checklist.priority.medium")
										: t("checklist.priority.low")}
							</span>
						)}
					</div>
					<button
						onClick={() => setSelectedItem(null)}
						className="text-gray-400 hover:text-gray-600 flex-shrink-0"
						aria-label="Close"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* スクロール可能コンテンツ */}
			<div className="flex-1 overflow-y-auto p-4">
				{/* 詳細説明（Markdown）- メインコンテンツ、折りたたみ可能 */}
				{resolved.longDescription && (
					<div className="mb-6">
						<div
							className={`text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none ${
								!expandedSections.has("longDescription") ? "line-clamp-3" : ""
							}`}
						>
							<ReactMarkdown
								components={{
									p: ({ children }) => (
										<p className="mb-3 last:mb-0">{children}</p>
									),
									ul: ({ children }) => (
										<ul className="list-disc list-inside mb-3 space-y-1.5">
											{children}
										</ul>
									),
									ol: ({ children }) => (
										<ol className="list-decimal list-inside mb-3 space-y-1.5">
											{children}
										</ol>
									),
									li: ({ children }) => (
										<li className="ml-2">{children}</li>
									),
									strong: ({ children }) => (
										<strong className="font-semibold text-gray-800">
											{children}
										</strong>
									),
									em: ({ children }) => (
										<em className="italic text-gray-600">{children}</em>
									),
									code: ({ children }) => (
										<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-red-600">
											{children}
										</code>
									),
									pre: ({ children }) => (
										<pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto mb-3">
											{children}
										</pre>
									),
									a: ({ href, children }) => (
										<a
											href={href}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:text-blue-800 underline"
										>
											{children}
										</a>
									),
									h1: ({ children }) => (
										<h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-900">
											{children}
										</h1>
									),
									h2: ({ children }) => (
										<h2 className="text-lg font-bold mb-2 mt-4 first:mt-0 text-gray-800">
											{children}
										</h2>
									),
									h3: ({ children }) => (
										<h3 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-gray-700">
											{children}
										</h3>
									),
								}}
							>
								{resolved.longDescription}
							</ReactMarkdown>
						</div>
						<button
							type="button"
							onClick={() => toggleSection("longDescription")}
							className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
						>
							{expandedSections.has("longDescription")
								? t("checklist.readLess")
								: t("checklist.readMore")}
						</button>
					</div>
				)}

				{/* 折りたたみ可能な補助情報 */}
				<div className="space-y-3">
					{/* ユーザーメモ（折りたたみ可能） */}
					<div className="border border-gray-200 rounded-lg overflow-hidden">
						<button
							type="button"
							onClick={() => toggleSection("userMemo")}
							className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
						>
							<span className="text-sm font-semibold text-gray-700">
								{t("checklist.userMemo")}
							</span>
							<svg
								className={`w-4 h-4 text-gray-500 transition-transform ${
									expandedSections.has("userMemo") ? "rotate-180" : ""
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
						{expandedSections.has("userMemo") && (
							<div className="p-4">
								<textarea
									value={selectedItem.userMemo || ""}
									onChange={(e) => {
										updateUserMemo(selectedItem.id, e.target.value);
									}}
									disabled={readOnly}
									placeholder={t("checklist.userMemo.placeholder")}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px] disabled:bg-gray-100 disabled:cursor-not-allowed"
									rows={3}
								/>
							</div>
						)}
					</div>

					{/* カテゴリ内の進捗状況（折りたたみ可能） */}
					{selectedItem.generatedFrom && (
						<div className="border border-gray-200 rounded-lg overflow-hidden">
							<button
								type="button"
								onClick={() => toggleSection("progress")}
								className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
							>
								<span className="text-sm font-semibold text-gray-700">
									{t("checklist.categoryProgress")}
								</span>
								<svg
									className={`w-4 h-4 text-gray-500 transition-transform ${
										expandedSections.has("progress") ? "rotate-180" : ""
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
							{expandedSections.has("progress") && (
								<div className="p-4">
									{(() => {
										const categoryItems = items.filter(
											(item) =>
												item.generatedFrom === selectedItem.generatedFrom,
										);
										const completedCount = categoryItems.filter(
											(item) => item.done,
										).length;
										const totalCount = categoryItems.length;
										const progressPercentage =
											totalCount > 0
												? Math.round((completedCount / totalCount) * 100)
												: 0;
										return (
											<div className="space-y-2">
												<div className="flex items-center justify-between text-sm">
													<span className="text-gray-600">
														{getGroupName(selectedItem.generatedFrom)}
													</span>
													<span className="text-gray-700 font-medium">
														{completedCount} / {totalCount}
													</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div
														className="bg-blue-600 h-2 rounded-full transition-all"
														style={{ width: `${progressPercentage}%` }}
													/>
												</div>
												<p className="text-xs text-gray-500">
													{progressPercentage}%{" "}
													{t("checklist.progress.completed")}
												</p>
											</div>
										);
									})()}
								</div>
							)}
						</div>
					)}

					{/* リンク（折りたたみ可能） */}
					{selectedItem.links && selectedItem.links.length > 0 && (
						<div className="border border-gray-200 rounded-lg overflow-hidden">
							<button
								type="button"
								onClick={() => toggleSection("links")}
								className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
							>
								<span className="text-sm font-semibold text-gray-700">
									{t("checklist.links")} ({selectedItem.links.length})
								</span>
								<svg
									className={`w-4 h-4 text-gray-500 transition-transform ${
										expandedSections.has("links") ? "rotate-180" : ""
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
							{expandedSections.has("links") && (
								<div className="p-4">
									<div className="space-y-2">
										{selectedItem.links.map((link, idx) => (
											<a
												key={idx}
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												className="block px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
											>
												{link.label}
											</a>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* 関連アイテム（折りたたみ可能） */}
					{selectedItem.generatedFrom && (
						<div className="border border-gray-200 rounded-lg overflow-hidden">
							<button
								type="button"
								onClick={() => toggleSection("related")}
								className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
							>
								<span className="text-sm font-semibold text-gray-700">
									{t("checklist.relatedItems")}
								</span>
								<svg
									className={`w-4 h-4 text-gray-500 transition-transform ${
										expandedSections.has("related") ? "rotate-180" : ""
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
							{expandedSections.has("related") && (
								<div className="p-4">
									{(() => {
										const relatedItems = items
											.filter(
												(item) =>
													item.generatedFrom === selectedItem.generatedFrom &&
													item.id !== selectedItem.id,
											)
											.slice(0, 5); // 最大5個まで表示
										if (relatedItems.length === 0) {
											return (
												<p className="text-sm text-gray-500">
													{t("checklist.relatedItems.empty")}
												</p>
											);
										}
										return (
											<div className="space-y-1">
												{relatedItems.map((item) => {
													const itemResolved = resolveChecklistItemText(
														item,
														item.generatedFrom,
														item.itemKey,
													);
													return (
														<button
															key={item.id}
															onClick={() => setSelectedItem(item)}
															className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-between"
														>
															<span
																className={
																	item.done
																		? "text-gray-400 line-through"
																		: "text-gray-700"
																}
															>
																{itemResolved.title}
															</span>
															{item.done && (
																<span className="text-xs text-green-600 ml-2">
																	✓
																</span>
															)}
														</button>
													);
												})}
											</div>
										);
									})()}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

