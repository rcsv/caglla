"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import { useRouter } from "next/navigation";
import type { Trip } from "@/lib/core/types";
import Loading from "@/components/common/Loading";
import { t } from "@/lib/i18n";
import Image from "next/image";

interface QuickPlanModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface Template {
	id: string;
	title: string;
	destination?: string;
	description?: string;
	image_url?: string;
	day_count?: number;
	creator?: {
		name?: string;
		slug?: string;
	};
}

interface PlanFormData {
	destination: string;
	startDate: string;
	endDate: string;
}

export default function QuickPlanModal({
	isOpen,
	onClose,
}: QuickPlanModalProps) {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	const [templates, setTemplates] = useState<Template[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
		null,
	);
	const [formData, setFormData] = useState<PlanFormData>({
		destination: "",
		startDate: "",
		endDate: "",
	});
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (isOpen) {
			loadTemplates();
			setSelectedTemplate(null);
			setFormData({ destination: "", startDate: "", endDate: "" });
			setError(null);
		}
	}, [isOpen]);

	const loadTemplates = async () => {
		setIsLoading(true);
		try {
			const response = await makeAuthenticatedRequest<{
				success: boolean;
				data: Template[];
			}>("/api/templates");
			if (response.success && response.data) {
				setTemplates(response.data);
			}
		} catch (error) {
			console.error("Load templates error:", error);
			setError("Guideの読み込みに失敗しました");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectTemplate = (template: Template) => {
		setSelectedTemplate(template);
		// テンプレートの目的地を初期値として設定
		if (template.destination) {
			setFormData((prev) => ({
				...prev,
				destination: template.destination || "",
			}));
		}
	};

	const handleCreatePlan = async () => {
		if (!selectedTemplate) return;

		// バリデーション
		if (!formData.destination.trim()) {
			setError("目的地を入力してください");
			return;
		}
		if (!formData.startDate || !formData.endDate) {
			setError("開始日と終了日を入力してください");
			return;
		}

		const startDate = new Date(formData.startDate);
		const endDate = new Date(formData.endDate);
		if (startDate > endDate) {
			setError("終了日は開始日より後である必要があります");
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			const response = await makeAuthenticatedRequest<{
				success: boolean;
				data: { trip: Trip };
			}>("/api/templates", {
				method: "POST",
				body: JSON.stringify({
					templateId: selectedTemplate.id,
					customizations: {
						destination: formData.destination,
						start_date: formData.startDate,
						end_date: formData.endDate,
					},
				}),
			});

			if (response.success && response.data?.trip) {
				// プラン作成成功 → プランページに遷移
				onClose();
				router.push("/plan");
			} else {
				setError("プランの作成に失敗しました");
			}
		} catch (error) {
			console.error("Create plan error:", error);
			setError("プランの作成に失敗しました");
		} finally {
			setIsCreating(false);
		}
	};

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	if (!isOpen || !mounted) return null;

	const modalContent = (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-dialog-overlay"
			onClick={handleBackdropClick}
		>
			<div
				className="bg-white rounded-sm shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div>
						<h2 className="text-2xl font-bold text-gray-900">Quick Plan</h2>
						<p className="text-sm text-gray-600 mt-1">
							Guideから素早くプランを作成
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
						disabled={isCreating}
					>
						<Icon icon="mdi:close" className="h-6 w-6" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">
					{!selectedTemplate ? (
						// Guide選択画面
						<>
							{isLoading ? (
								<div className="flex items-center justify-center py-12">
									<Loading size="lg" />
								</div>
							) : error ? (
								<div className="text-center py-12">
									<p className="text-red-600 mb-4">{error}</p>
									<button
										onClick={loadTemplates}
										className="px-4 py-2 bg-indigo-600 text-white rounded-sm hover:bg-indigo-700 transition-colors"
									>
										再試行
									</button>
								</div>
							) : templates.length === 0 ? (
								<div className="text-center py-12">
									<Icon
										icon="mdi:file-document-outline"
										className="h-16 w-16 text-gray-400 mx-auto mb-4"
									/>
									<p className="text-gray-600">利用可能なGuideがありません</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{templates.map((template) => (
										<button
											key={template.id}
											onClick={() => handleSelectTemplate(template)}
											className="text-left border border-gray-200 rounded-sm p-4 hover:border-indigo-300 hover:shadow-sm transition-all bg-white"
										>
											<div className="flex items-start gap-4">
												{template.image_url && (
													<div className="w-24 h-24 flex-shrink-0 rounded-sm overflow-hidden bg-gray-100">
														<Image
															src={template.image_url}
															alt={template.title}
															width={96}
															height={96}
															className="w-full h-full object-cover"
														/>
													</div>
												)}
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
														{template.title}
													</h3>
													{template.destination && (
														<p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
															<Icon icon="mdi:map-marker" className="h-4 w-4" />
															{template.destination}
														</p>
													)}
													{template.description && (
														<p className="text-sm text-gray-500 line-clamp-2 mb-2">
															{template.description}
														</p>
													)}
													<div className="flex items-center gap-3 text-xs text-gray-500">
														{template.day_count && (
															<span className="flex items-center gap-1">
																<Icon
																	icon="mdi:calendar-clock"
																	className="h-4 w-4"
																/>
																{template.day_count}日間
															</span>
														)}
														{template.creator?.name && (
															<span className="flex items-center gap-1">
																<Icon icon="mdi:account" className="h-4 w-4" />
																{template.creator.name}
															</span>
														)}
													</div>
												</div>
											</div>
										</button>
									))}
								</div>
							)}
						</>
					) : (
						// プラン作成フォーム
						<div className="max-w-2xl mx-auto">
							<button
								onClick={() => setSelectedTemplate(null)}
								className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
								disabled={isCreating}
							>
								<Icon icon="mdi:arrow-left" className="h-5 w-5" />
								<span>Guide選択に戻る</span>
							</button>

							{/* 選択されたGuide情報 */}
							<div className="bg-indigo-50 border border-indigo-200 rounded-sm p-4 mb-6">
								<div className="flex items-start gap-4">
									{selectedTemplate.image_url && (
										<div className="w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden bg-gray-100">
											<Image
												src={selectedTemplate.image_url}
												alt={selectedTemplate.title}
												width={80}
												height={80}
												className="w-full h-full object-cover"
											/>
										</div>
									)}
									<div className="flex-1">
										<h3 className="font-semibold text-gray-900 mb-1">
											{selectedTemplate.title}
										</h3>
										{selectedTemplate.description && (
											<p className="text-sm text-gray-600">
												{selectedTemplate.description}
											</p>
										)}
									</div>
								</div>
							</div>

							{/* フォーム */}
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										目的地 <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={formData.destination}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												destination: e.target.value,
											}))
										}
										placeholder="例: 沖縄県那覇市"
										className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
										disabled={isCreating}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											開始日 <span className="text-red-500">*</span>
										</label>
										<input
											type="date"
											value={formData.startDate}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													startDate: e.target.value,
												}))
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
											disabled={isCreating}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											終了日 <span className="text-red-500">*</span>
										</label>
										<input
											type="date"
											value={formData.endDate}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													endDate: e.target.value,
												}))
											}
											min={formData.startDate}
											className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
											disabled={isCreating}
										/>
									</div>
								</div>

								{error && (
									<div className="bg-red-50 border border-red-200 rounded-sm p-3">
										<p className="text-sm text-red-600">{error}</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				{selectedTemplate && (
					<div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
						<button
							onClick={onClose}
							className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
							disabled={isCreating}
						>
							キャンセル
						</button>
						<button
							onClick={handleCreatePlan}
							disabled={
								isCreating ||
								!formData.destination.trim() ||
								!formData.startDate ||
								!formData.endDate
							}
							className="px-6 py-2 bg-indigo-600 text-white rounded-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{isCreating ? (
								<>
									<Loading size="sm" inline />
									<span>作成中...</span>
								</>
							) : (
								<>
									<Icon icon="mdi:check" className="h-5 w-5" />
									<span>プランを作成</span>
								</>
							)}
						</button>
					</div>
				)}
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
