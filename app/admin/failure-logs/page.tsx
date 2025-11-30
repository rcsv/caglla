"use client";

import { useState, useEffect } from "react";
import { timezoneUtils } from "@/lib/utils/timezone";
import { currencyUtils } from "@/lib/utils/currency";
import type { TimezoneFailureLog, CurrencyFailureLog } from "@/lib/core/types";
import { t } from "@/lib/i18n";

export default function FailureLogsPage() {
	const [timezoneLogs, setTimezoneLogs] = useState<TimezoneFailureLog[]>([]);
	const [currencyLogs, setCurrencyLogs] = useState<CurrencyFailureLog[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		loadLogs();
	}, []);

	const loadLogs = () => {
		const tzLogs = timezoneUtils.getFailureLogs();
		const currLogs = currencyUtils.getCurrencyFailureLogs();
		setTimezoneLogs(tzLogs);
		setCurrencyLogs(currLogs);
	};

	const handleClearTimezoneLogs = () => {
		if (confirm(t("admin.logs.timezone.deleteConfirm"))) {
			timezoneUtils.clearFailureLogs();
			loadLogs();
		}
	};

	const handleClearCurrencyLogs = () => {
		if (confirm(t("admin.logs.currency.deleteConfirm"))) {
			currencyUtils.clearCurrencyFailureLogs();
			loadLogs();
		}
	};

	const handleProcessTimezoneBatch = async () => {
		setIsLoading(true);
		try {
			const result = timezoneUtils.processBatchUpdate();
			if (result.processedCount > 0) {
				alert(
					t("admin.logs.timezone.processed").replace(
						"{count}",
						result.processedCount.toString(),
					),
				);
				loadLogs();
			} else {
				alert(t("admin.logs.insufficientLogs"));
			}
		} catch (error) {
			alert(t("admin.logs.batchFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleProcessCurrencyBatch = async () => {
		setIsLoading(true);
		try {
			const result = currencyUtils.processCurrencyBatchUpdate();
			if (result.processedCount > 0) {
				alert(
					t("admin.logs.currency.processed").replace(
						"{count}",
						result.processedCount.toString(),
					),
				);
				loadLogs();
			} else {
				alert(t("admin.logs.insufficientLogs"));
			}
		} catch (error) {
			alert(t("admin.logs.batchFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	const timezoneStats = {
		total: timezoneLogs.length,
		pending: timezoneLogs.filter((log) => log.status === "pending").length,
		processed: timezoneLogs.filter((log) => log.status === "processed").length,
		ignored: timezoneLogs.filter((log) => log.status === "ignored").length,
	};

	const currencyStats = {
		total: currencyLogs.length,
		pending: currencyLogs.filter((log) => log.status === "pending").length,
		processed: currencyLogs.filter((log) => log.status === "processed").length,
		ignored: currencyLogs.filter((log) => log.status === "ignored").length,
	};

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">失敗ログ管理</h1>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* タイムゾーンログ */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">タイムゾーン失敗ログ</h2>
							<div className="flex gap-2">
								<button
									onClick={handleProcessTimezoneBatch}
									disabled={isLoading || timezoneStats.pending < 50}
									className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
								>
									バッチ処理 ({timezoneStats.pending}/50)
								</button>
								<button
									onClick={handleClearTimezoneLogs}
									className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
								>
									全削除
								</button>
							</div>
						</div>

						<div className="grid grid-cols-4 gap-4 mb-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">
									{timezoneStats.total}
								</div>
								<div className="text-sm text-gray-600">総数</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-yellow-600">
									{timezoneStats.pending}
								</div>
								<div className="text-sm text-gray-600">保留中</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-600">
									{timezoneStats.processed}
								</div>
								<div className="text-sm text-gray-600">
									{t("adminFailureLogs.processed")}
								</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-gray-600">
									{timezoneStats.ignored}
								</div>
								<div className="text-sm text-gray-600">無視</div>
							</div>
						</div>

						{timezoneLogs.length > 0 && (
							<div className="max-h-64 overflow-y-auto">
								<div className="space-y-2">
									{timezoneLogs.slice(0, 10).map((log) => (
										<div key={log.id} className="border rounded p-3 text-sm">
											<div className="font-medium">{log.place_data.name}</div>
											<div className="text-gray-600">
												{log.formatted_address}
											</div>
											<div className="text-xs text-gray-500 mt-1">
												理由: {log.failure_reason} | 都市:{" "}
												{log.detected_city || "N/A"} | 国:{" "}
												{log.detected_country || "N/A"}
											</div>
										</div>
									))}
									{timezoneLogs.length > 10 && (
										<div className="text-center text-gray-500 text-sm">
											他 {timezoneLogs.length - 10} 件のログがあります
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* 通貨ログ */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">通貨失敗ログ</h2>
							<div className="flex gap-2">
								<button
									onClick={handleProcessCurrencyBatch}
									disabled={isLoading || currencyStats.pending < 50}
									className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
								>
									バッチ処理 ({currencyStats.pending}/50)
								</button>
								<button
									onClick={handleClearCurrencyLogs}
									className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
								>
									全削除
								</button>
							</div>
						</div>

						<div className="grid grid-cols-4 gap-4 mb-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">
									{currencyStats.total}
								</div>
								<div className="text-sm text-gray-600">総数</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-yellow-600">
									{currencyStats.pending}
								</div>
								<div className="text-sm text-gray-600">保留中</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-600">
									{currencyStats.processed}
								</div>
								<div className="text-sm text-gray-600">
									{t("adminFailureLogs.processed")}
								</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-gray-600">
									{currencyStats.ignored}
								</div>
								<div className="text-sm text-gray-600">無視</div>
							</div>
						</div>

						{currencyLogs.length > 0 && (
							<div className="max-h-64 overflow-y-auto">
								<div className="space-y-2">
									{currencyLogs.slice(0, 10).map((log) => (
										<div key={log.id} className="border rounded p-3 text-sm">
											<div className="font-medium">{log.place_data.name}</div>
											<div className="text-gray-600">
												{log.formatted_address}
											</div>
											<div className="text-xs text-gray-500 mt-1">
												理由: {log.failure_reason} | 都市:{" "}
												{log.detected_city || "N/A"} | 国:{" "}
												{log.detected_country || "N/A"}
											</div>
										</div>
									))}
									{currencyLogs.length > 10 && (
										<div className="text-center text-gray-500 text-sm">
											他 {currencyLogs.length - 10} 件のログがあります
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 className="font-semibold text-blue-900 mb-2">
						{t("adminFailureLogs.aboutThisPage")}
					</h3>
					<p className="text-blue-800 text-sm">
						このページでは、タイムゾーンと通貨の推定に失敗した場所のログを管理できます。
						ログが50件蓄積されると警告が表示されます。バッチ処理を実行することで、
						頻繁に失敗する都市名のマッピングを改善できます。
					</p>
				</div>
			</div>
		</div>
	);
}
