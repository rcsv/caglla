"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import type { Trip } from "@/lib/core/types";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import logger from "@/lib/core/logger";
import { t } from "@/lib/i18n";

interface DeleteGuideModalProps {
	trip: Trip;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

/**
 * ガイド削除モーダル
 *
 * ガイドを削除します。
 *
 * @remarks
 * 将来のコレクション分離時も、このコンポーネントはそのまま使用可能です。
 */
export function DeleteGuideModal({
	trip,
	isOpen,
	onClose,
	onSuccess,
}: DeleteGuideModalProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!isOpen) return null;

	const handleDelete = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await makeAuthenticatedRequest(
				`/api/trip/${trip.slug || trip.id}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				let errorMessage = `Failed to delete guide: ${response.status}`;
				try {
					const errorData = await response.json();
					if (typeof errorData === "string") {
						errorMessage = errorData;
					} else if (errorData?.error) {
						errorMessage =
							typeof errorData.error === "string"
								? errorData.error
								: String(errorData.error);
					} else if (errorData?.message) {
						errorMessage = errorData.message;
					}
				} catch {
					// JSON解析に失敗した場合はデフォルトメッセージを使用
				}
				throw new Error(errorMessage);
			}

			logger.info("Guide deleted successfully", { tripId: trip.id });
			onSuccess();
			onClose();
		} catch (err: any) {
			logger.error("Error deleting guide", err);
			const errorMessage =
				err instanceof Error
					? err.message
					: typeof err === "string"
						? err
						: err?.message || String(err) || "Failed to delete guide";
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
				{/* オーバーレイ */}
				<div
					className="fixed inset-0 transition-opacity bg-gray-500/75"
					onClick={onClose}
				/>

				{/* モーダル */}
				<div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<div className="sm:flex sm:items-start">
							<div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
								<Icon icon="mdi:delete" className="h-6 w-6 text-red-600" />
							</div>
							<div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
								<h3 className="text-lg leading-6 font-medium text-gray-900">
									{t("tripGuide.modals.delete.title", "ガイドを削除しますか？")}
								</h3>
								<div className="mt-2">
									<p className="text-sm text-gray-500">
										{t(
											"tripGuide.modals.delete.message",
											"この操作は取り消せません。ガイドとそのすべてのデータが永久に削除されます。",
										)}
									</p>
									<p className="text-sm font-medium text-gray-900 mt-2">
										{trip.title ||
											t("tripGuide.modals.delete.untitled", "Untitled Guide")}
									</p>
								</div>
								{error && (
									<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-sm">
										<p className="text-sm text-red-800">{error}</p>
									</div>
								)}
							</div>
						</div>
					</div>
					<div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							onClick={handleDelete}
							disabled={loading}
							className="w-full inline-flex justify-center rounded-sm border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<>
									<Icon
										icon="mdi:loading"
										className="animate-spin h-5 w-5 mr-2"
									/>
									{t("tripGuide.modals.delete.deleting", "削除中...")}
								</>
							) : (
								t("tripGuide.modals.delete.confirm", "削除する")
							)}
						</button>
						<button
							type="button"
							onClick={onClose}
							disabled={loading}
							className="mt-3 w-full inline-flex justify-center rounded-sm border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{t("tripGuide.modals.delete.cancel", "キャンセル")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
