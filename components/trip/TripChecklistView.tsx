"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ChecklistItem } from "@/lib/core/types";
import PresetLibraryModal from "@/components/modals/PresetLibraryModal";
import { IconRenderer } from "@/components/common/icons/IconRenderer";
import { t } from "@/lib/i18n";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import {
	getSecondaryCategoryLabel,
	getPrimaryCategoryFromSecondary,
} from "@/lib/data/activity-categories";
import ReactMarkdown from "react-markdown";

interface TripChecklistViewProps {
	tripId?: string;
	readOnly?: boolean;
}

export default function TripChecklistView({
	tripId,
	readOnly = false,
}: TripChecklistViewProps) {
	const params = useParams();
	const tripSlug = params?.tripSlug as string | undefined;
	const [items, setItems] = useState<ChecklistItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [showLibraryModal, setShowLibraryModal] = useState(false);
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
	const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
	// 右ペインの折りたたみ状態
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(["userMemo"]), // デフォルトでユーザーメモは展開
	);

	// 取得
	useEffect(() => {
		const fetchChecklist = async () => {
			if (!tripId) return;
			try {
				setLoading(true);
				const res = await makeAuthenticatedRequest(
					`/api/trips/${tripId}/checklist`,
					{ cache: "no-store" },
				);
				if (res.ok) {
					const data = await res.json();
					// 既存データとの互換性: linksがない場合は空配列を設定
					const normalizedItems = (data.items || []).map((item: ChecklistItem) => ({
						...item,
						links: item.links || [],
					}));
					// デバッグ: longDescriptionが含まれているアイテムをログ出力
					const itemsWithLongDesc = normalizedItems.filter(
						(item) => item.longDescription && item.longDescription.length > 0,
					);
					console.log("Fetched checklist items with longDescription:", {
						count: itemsWithLongDesc.length,
						titles: itemsWithLongDesc.map((item) => ({
							title: item.title,
							hasLongDesc: !!item.longDescription,
							length: item.longDescription?.length || 0,
						})),
					});
					setItems(normalizedItems);
				} else {
					console.error("Failed to fetch checklist", await res.text());
				}
			} finally {
				setLoading(false);
			}
		};
		fetchChecklist();
	}, [tripId]);

	// 再生成
	const regenerate = async () => {
		if (!tripId) return;
		try {
			setSaving(true);
			const res = await makeAuthenticatedRequest(
				`/api/trips/${tripId}/checklist/generate`,
				{ method: "POST" },
			);
			if (res.ok) {
				const data = await res.json();
				// 既存データとの互換性: linksがない場合は空配列を設定
				const normalizedItems = (data.items || []).map((item: ChecklistItem) => ({
					...item,
					links: item.links || [],
				}));
				// デバッグ: longDescriptionが含まれているアイテムをログ出力
				const itemsWithLongDesc = normalizedItems.filter(
					(item) => item.longDescription && item.longDescription.length > 0,
				);
				console.log("Regenerated checklist items with longDescription:", {
					count: itemsWithLongDesc.length,
					titles: itemsWithLongDesc.map((item) => ({
						title: item.title,
						hasLongDesc: !!item.longDescription,
						length: item.longDescription?.length || 0,
					})),
				});
				setItems(normalizedItems);
				// 選択中のアイテムも更新（longDescriptionが生成された場合に反映される）
				if (selectedItem) {
					const updatedItem = normalizedItems.find((item) => item.id === selectedItem.id);
					if (updatedItem) {
						console.log("Updating selectedItem:", {
							title: updatedItem.title,
							hasLongDesc: !!updatedItem.longDescription,
							length: updatedItem.longDescription?.length || 0,
						});
						setSelectedItem(updatedItem);
					}
				}
			} else {
				console.error("Failed to regenerate checklist", await res.text());
			}
		} finally {
			setSaving(false);
		}
	};

	// 保存
	const persist = async (next: ChecklistItem[]) => {
		if (!tripId) return;
		try {
			setSaving(true);
			const res = await makeAuthenticatedRequest(
				`/api/trips/${tripId}/checklist`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ items: next }),
				},
			);
			if (res.ok) {
				const data = await res.json();
				setItems(data.items || next);
			} else {
				console.error("Failed to save checklist", await res.text());
				setItems(next);
			}
		} finally {
			setSaving(false);
		}
	};

	// トグル
	const toggle = (id: string) => {
		if (readOnly) return; // 閲覧専用モードでは変更不可
		const next = items.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
		setItems(next);
		persist(next);
	};

	// カスタム追加
	const [input, setInput] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<
		"preparation" | "packing"
	>("packing");

	const addCustom = () => {
		if (readOnly) return; // 閲覧専用モードでは追加不可
		const t = input.trim();
		if (!t) return;
		const next: ChecklistItem[] = [
			...items,
			{
				id: `custom_${Date.now()}`,
				title: t,
				category: selectedCategory,
				done: false,
				isCustom: true,
			},
		];
		setItems(next);
		setInput("");
		persist(next);
	};

	// アイテム削除
	const removeItem = (id: string) => {
		if (readOnly) return; // 閲覧専用モードでは削除不可
		const next = items.filter((i) => i.id !== id);
		setItems(next);
		persist(next);
	};

	// 生成根拠でグループ化
	const groupedPrepItems = useMemo(() => {
		const prepItems = items.filter((i) => i.category === "preparation");
		return prepItems.reduce((acc, item) => {
			let groupKey = "custom";

			// カスタムアイテムは常にcustomグループ
			if (item.isCustom) {
				groupKey = "custom";
			} else if (item.generatedFrom) {
				// generatedFromが有効かチェック
				const primaryCategory = getPrimaryCategoryFromSecondary(
					item.generatedFrom,
				);
				if (primaryCategory) {
					groupKey = item.generatedFrom; // secondaryCategory ID
				}
				// primaryCategoryがnullの場合はcustomグループへfallback
			}

			if (!acc[groupKey]) acc[groupKey] = [];
			acc[groupKey].push(item);
			return acc;
		}, {} as Record<string, ChecklistItem[]>);
	}, [items]);

	const groupedPackItems = useMemo(() => {
		const packItems = items.filter((i) => i.category === "packing");
		return packItems.reduce((acc, item) => {
			let groupKey = "custom";

			// カスタムアイテムは常にcustomグループ
			if (item.isCustom) {
				groupKey = "custom";
			} else if (item.generatedFrom) {
				// generatedFromが有効かチェック
				const primaryCategory = getPrimaryCategoryFromSecondary(
					item.generatedFrom,
				);
				if (primaryCategory) {
					groupKey = item.generatedFrom; // secondaryCategory ID
				}
				// primaryCategoryがnullの場合はcustomグループへfallback
			}

			if (!acc[groupKey]) acc[groupKey] = [];
			acc[groupKey].push(item);
			return acc;
		}, {} as Record<string, ChecklistItem[]>);
	}, [items]);

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
								onClick={() => setShowLibraryModal(true)}
								className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
							>
								{t("checklist.applyPreset")}
							</button>
							<button
								onClick={regenerate}
								disabled={saving || !tripId}
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
								onKeyDown={(e) => e.key === "Enter" && addCustom()}
								placeholder={t("checklist.addCustom.placeholder")}
								className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								onClick={addCustom}
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
						{/* 左側：アイテム一覧（40%） */}
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
								{Object.entries(groupedPrepItems).map(
									([groupKey, groupItems]) => {
										const isExpanded = expandedGroups.has(groupKey);
										const groupName = getGroupName(groupKey);
										return (
											<div key={groupKey} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
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
															<li
																key={item.id}
																className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors ${
																	selectedItem?.id === item.id
																		? "bg-blue-50 border border-blue-200"
																		: ""
																}`}
																onClick={() => {
																	console.log("Selecting item:", {
																		title: item.title,
																		hasLongDesc: !!item.longDescription,
																		length: item.longDescription?.length || 0,
																		longDescPreview: item.longDescription?.substring(0, 100),
																	});
																	setSelectedItem(item);
																}}
															>
										<input
											type="checkbox"
											className="w-4 h-4 flex-shrink-0"
											checked={!!item.done}
																	onChange={(e) => {
																		e.stopPropagation();
																		toggle(item.id);
																	}}
											disabled={readOnly}
										/>
										<div className={`flex-1 min-w-0 ${item.done ? "text-gray-400 opacity-60" : "text-gray-800"}`}>
											<div className="font-medium">{item.title}</div>
											{item.description && (
												<div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
													{item.description}
												</div>
											)}
										</div>
										{/* 優先度バッジ（右端に寄せる） */}
										<div className="flex items-center gap-1 ml-auto">
											{item.priority === "high" && (
												<span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
													高
												</span>
											)}
											{item.priority === "medium" && (
												<span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
													中
												</span>
											)}
											{item.priority === "low" && (
												<span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
													低
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
											{item.isCustom && !readOnly && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														removeItem(item.id);
													}}
													className="text-xs text-gray-500 hover:text-red-600"
												>
													{t("checklist.delete")}
												</button>
											)}
										</div>
									</li>
								))}
													</ul>
												)}
											</div>
										);
									},
								)}
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
								{Object.entries(groupedPackItems).map(
									([groupKey, groupItems]) => {
										const isExpanded = expandedGroups.has(groupKey);
										const groupName = getGroupName(groupKey);
										return (
											<div key={groupKey} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
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
															<li
																key={item.id}
																className={`flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors ${
																	selectedItem?.id === item.id
																		? "bg-blue-50 border border-blue-200"
																		: ""
																}`}
																onClick={() => {
																	console.log("Selecting item:", {
																		title: item.title,
																		hasLongDesc: !!item.longDescription,
																		length: item.longDescription?.length || 0,
																		longDescPreview: item.longDescription?.substring(0, 100),
																	});
																	setSelectedItem(item);
																}}
															>
																<input
																	type="checkbox"
																	className="w-4 h-4 flex-shrink-0"
																	checked={!!item.done}
																	onChange={(e) => {
																		e.stopPropagation();
																		toggle(item.id);
																	}}
																	disabled={readOnly}
																/>
																<div className={`flex-1 min-w-0 ${item.done ? "text-gray-400 opacity-60" : "text-gray-800"}`}>
																	<div className="font-medium">{item.title}</div>
																	{item.description && (
																		<div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
																			{item.description}
																		</div>
																	)}
																</div>
																{/* 優先度バッジ（右端に寄せる） */}
																<div className="flex items-center gap-1 ml-auto">
																	{item.priority === "high" && (
																		<span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
																			高
																		</span>
																	)}
																	{item.priority === "medium" && (
																		<span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
																			中
																		</span>
																	)}
																	{item.priority === "low" && (
																		<span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
																			低
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
																	{item.isCustom && !readOnly && (
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				removeItem(item.id);
																			}}
																			className="text-xs text-gray-500 hover:text-red-600"
																		>
																			{t("checklist.delete")}
																		</button>
																	)}
																</div>
															</li>
								))}
							</ul>
												)}
											</div>
										);
									},
								)}
								{Object.keys(groupedPackItems).length === 0 && (
									<div className="text-sm text-gray-500 ml-6">
										{t("checklist.noItems")}
									</div>
								)}
							</div>
						</div>
						</div>

						{/* 右側：詳細パネル（60%） */}
						<div
							id="checklist-detail"
							className="hidden lg:block lg:w-[60%] border border-gray-200 rounded-lg bg-white overflow-y-auto flex flex-col"
						>
							{selectedItem ? (
								<>
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
																element.classList.remove(
																	"ring-2",
																	"ring-blue-500",
																);
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
													{selectedItem.title}
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
										{(() => {
											console.log("Rendering longDescription section:", {
												title: selectedItem.title,
												hasLongDesc: !!selectedItem.longDescription,
												length: selectedItem.longDescription?.length || 0,
												longDescValue: selectedItem.longDescription,
											});
											return null;
										})()}
										{selectedItem.longDescription && (
											<div className="mb-6">
												<div
													className={`text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none ${
														!expandedSections.has("longDescription")
															? "line-clamp-3"
															: ""
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
														{selectedItem.longDescription}
													</ReactMarkdown>
												</div>
												<button
													type="button"
													onClick={() => {
														const newExpanded = new Set(expandedSections);
														if (newExpanded.has("longDescription")) {
															newExpanded.delete("longDescription");
														} else {
															newExpanded.add("longDescription");
														}
														setExpandedSections(newExpanded);
													}}
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
													onClick={() => {
														const newExpanded = new Set(expandedSections);
														if (newExpanded.has("userMemo")) {
															newExpanded.delete("userMemo");
														} else {
															newExpanded.add("userMemo");
														}
														setExpandedSections(newExpanded);
													}}
													className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
												>
													<span className="text-sm font-semibold text-gray-700">
														{t("checklist.userMemo")}
													</span>
													<svg
														className={`w-4 h-4 text-gray-500 transition-transform ${
															expandedSections.has("userMemo")
																? "rotate-180"
																: ""
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
																if (readOnly) return;
																const updatedItems = items.map((item) =>
																	item.id === selectedItem.id
																		? { ...item, userMemo: e.target.value }
																		: item,
																);
																setItems(updatedItems);
																// 選択中のアイテムも更新
																setSelectedItem({
																	...selectedItem,
																	userMemo: e.target.value,
																});
																// デバウンスして保存
																clearTimeout(
																	(window as any).__checklistMemoTimeout,
																);
																(window as any).__checklistMemoTimeout =
																	setTimeout(() => {
																		persist(updatedItems);
																	}, 500);
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
														onClick={() => {
															const newExpanded = new Set(expandedSections);
															if (newExpanded.has("progress")) {
																newExpanded.delete("progress");
															} else {
																newExpanded.add("progress");
															}
															setExpandedSections(newExpanded);
														}}
														className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
													>
														<span className="text-sm font-semibold text-gray-700">
															{t("checklist.categoryProgress")}
														</span>
														<svg
															className={`w-4 h-4 text-gray-500 transition-transform ${
																expandedSections.has("progress")
																	? "rotate-180"
																	: ""
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
																		item.generatedFrom ===
																		selectedItem.generatedFrom,
																);
																const completedCount = categoryItems.filter(
																	(item) => item.done,
																).length;
																const totalCount = categoryItems.length;
																const progressPercentage =
																	totalCount > 0
																		? Math.round(
																				(completedCount / totalCount) * 100,
																			)
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
														onClick={() => {
															const newExpanded = new Set(expandedSections);
															if (newExpanded.has("links")) {
																newExpanded.delete("links");
															} else {
																newExpanded.add("links");
															}
															setExpandedSections(newExpanded);
														}}
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
														onClick={() => {
															const newExpanded = new Set(expandedSections);
															if (newExpanded.has("related")) {
																newExpanded.delete("related");
															} else {
																newExpanded.add("related");
															}
															setExpandedSections(newExpanded);
														}}
														className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
													>
														<span className="text-sm font-semibold text-gray-700">
															{t("checklist.relatedItems")}
														</span>
														<svg
															className={`w-4 h-4 text-gray-500 transition-transform ${
																expandedSections.has("related")
																	? "rotate-180"
																	: ""
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
																			item.generatedFrom ===
																				selectedItem.generatedFrom &&
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
																		{relatedItems.map((item) => (
																			<button
																				key={item.id}
																				onClick={() => {
																					console.log("Selecting item:", {
																						title: item.title,
																						hasLongDesc:
																							!!item.longDescription,
																						length:
																							item.longDescription?.length ||
																							0,
																						longDescPreview:
																							item.longDescription?.substring(
																								0,
																								100,
																							),
																					});
																					setSelectedItem(item);
																				}}
																				className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-between"
																			>
																				<span
																					className={
																						item.done
																							? "text-gray-400 line-through"
																							: "text-gray-700"
																					}
																				>
																					{item.title}
																				</span>
																				{item.done && (
																					<span className="text-xs text-green-600 ml-2">
																						✓
																					</span>
																				)}
																			</button>
																		))}
																	</div>
																);
															})()}
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								</>
							) : (
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
							)}
						</div>
					</div>
				)}
			</div>

			{/* モーダル */}
			<PresetLibraryModal
				isOpen={showLibraryModal}
				onClose={() => setShowLibraryModal(false)}
				tripId={tripId || ""}
				onApply={() => {
					// プリセット適用成功時、チェックリストを再取得
					const fetchChecklist = async () => {
						if (!tripId) return;
						try {
							const res = await fetch(`/api/trips/${tripId}/checklist`, {
								cache: "no-store",
							});
							if (res.ok) {
								const data = await res.json();
								setItems(data.items || []);
							}
						} catch (error) {
							console.error("Failed to fetch checklist", error);
						}
					};
					fetchChecklist();
					alert(t("checklist.preset.applySuccess"));
				}}
			/>
		</div>
	);
}
