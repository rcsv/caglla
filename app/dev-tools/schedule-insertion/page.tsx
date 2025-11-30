"use client";
import logger from "@/lib/core/logger";

import { useState } from "react";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import { useAuth } from "@/lib/contexts/auth";

export default function ScheduleInsertionTest() {
	const { user, loading } = useAuth();
	const [testResults, setTestResults] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const addTestResult = (message: string) => {
		setTestResults((prev) => [
			...prev,
			`${new Date().toLocaleTimeString()}: ${message}`,
		]);
	};

	const testScheduleInsertion = async () => {
		setIsLoading(true);
		setTestResults([]);

		try {
			addTestResult("スケジュール挿入テストを開始...");

			// 実際のtripからday_idを取得する必要があります
			// ここでは例として、ユーザーの最初のtripの最初のdayを使用
			addTestResult("⚠️ 注意: 実際のday_idを指定してください");
			addTestResult("現在はテスト用のday_idを使用しています");

			// テスト用のday_id（実際の値に置き換える必要があります）
			const testDayId = "test-day-id";

			// テスト用のplace_data
			const testPlaceData = {
				place_id: "test-place-1",
				name: "テスト場所1",
				formatted_address: "テスト住所1",
				geometry: {
					location: {
						lat: 35.6762,
						lng: 139.6503,
					},
				},
			};

			// 1. 最初のスケジュールを追加（最後に追加）
			addTestResult("1. 最初のスケジュールを追加（最後に追加）");
			const response1 = await makeAuthenticatedRequest("/api/itineraries", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					day_id: testDayId,
					place_data: testPlaceData,
					title: "テスト場所1",
					description: "テスト説明1",
					location: "テスト住所1",
				}),
			});

			if (response1.ok) {
				const schedule1 = await response1.json();
				addTestResult(
					`✅ 最初のスケジュール追加成功: sort_number=${schedule1.sort_number}`,
				);
			} else {
				const error1 = await response1.text();
				addTestResult(`❌ 最初のスケジュール追加失敗: ${error1}`);
				return;
			}

			// 2. 2番目のスケジュールを追加（最後に追加）
			addTestResult("2. 2番目のスケジュールを追加（最後に追加）");
			const testPlaceData2 = {
				...testPlaceData,
				place_id: "test-place-2",
				name: "テスト場所2",
			};

			const response2 = await makeAuthenticatedRequest("/api/itineraries", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					day_id: testDayId,
					place_data: testPlaceData2,
					title: "テスト場所2",
					description: "テスト説明2",
					location: "テスト住所2",
				}),
			});

			if (response2.ok) {
				const schedule2 = await response2.json();
				addTestResult(
					`✅ 2番目のスケジュール追加成功: sort_number=${schedule2.sort_number}`,
				);
			} else {
				const error2 = await response2.text();
				addTestResult(`❌ 2番目のスケジュール追加失敗: ${error2}`);
				return;
			}

			// 3. 間にスケジュールを挿入（位置0の後に挿入）
			addTestResult("3. 間にスケジュールを挿入（位置0の後に挿入）");
			const testPlaceData3 = {
				...testPlaceData,
				place_id: "test-place-3",
				name: "テスト場所3",
			};

			const response3 = await makeAuthenticatedRequest(
				"/api/itineraries/insert",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						day_id: testDayId,
						place_data: testPlaceData3,
						title: "テスト場所3",
						description: "テスト説明3",
						location: "テスト住所3",
						insert_after_index: 0,
					}),
				},
			);

			if (response3.ok) {
				const schedule3 = await response3.json();
				addTestResult(
					`✅ 間にスケジュール挿入成功: sort_number=${schedule3.sort_number}`,
				);
			} else {
				const error3 = await response3.text();
				addTestResult(`❌ 間にスケジュール挿入失敗: ${error3}`);
				return;
			}

			// 4. 現在のスケジュール一覧を取得して確認
			addTestResult("4. 現在のスケジュール一覧を取得して確認");
			const response4 = await makeAuthenticatedRequest(
				`/api/itineraries?day_id=${testDayId}`,
				{
					method: "GET",
				},
			);

			if (response4.ok) {
				const schedules = await response4.json();
				addTestResult(`✅ スケジュール一覧取得成功: ${schedules.length}件`);
				schedules.forEach((schedule: any, index: number) => {
					addTestResult(
						`  ${index + 1}. ${schedule.title} (sort_number: ${schedule.sort_number})`,
					);
				});
			} else {
				const error4 = await response4.text();
				addTestResult(`❌ スケジュール一覧取得失敗: ${error4}`);
			}

			addTestResult("🎉 テスト完了！");
		} catch (error) {
			addTestResult(`❌ テストエラー: ${error}`);
		} finally {
			setIsLoading(false);
		}
	};

	// 認証チェック
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				{require("@/components/common/Loading").default({ size: "md" })}
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">認証が必要です</h1>
					<p className="text-gray-600">
						このページにアクセスするにはログインが必要です。
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<div className="mb-6">
				<h1 className="text-2xl font-bold mb-2">スケジュール挿入機能テスト</h1>
				<p className="text-gray-600">
					新しいスケジュール挿入機能の動作確認ページです
				</p>
				<div className="mt-2 text-sm text-blue-600">
					ログインユーザー: {user.displayName || user.email}
				</div>
			</div>

			<div className="mb-6">
				<button
					onClick={testScheduleInsertion}
					disabled={isLoading}
					className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{isLoading ? "テスト実行中..." : "テストを実行"}
				</button>
			</div>

			<div className="bg-gray-100 p-4 rounded-lg">
				<h2 className="text-lg font-semibold mb-2">テスト結果:</h2>
				<div className="space-y-1 max-h-96 overflow-y-auto">
					{testResults.length === 0 ? (
						<p className="text-gray-500">テスト結果がありません</p>
					) : (
						testResults.map((result, index) => (
							<div key={index} className="text-sm font-mono">
								{result}
							</div>
						))
					)}
				</div>
			</div>

			<div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<h3 className="font-semibold text-yellow-800 mb-2">⚠️ 注意事項:</h3>
				<ul className="text-sm text-yellow-700 space-y-1">
					<li>• このテストは実際のFirestoreデータベースにデータを追加します</li>
					<li>• テスト前に適切な認証が必要です（現在ログイン済み）</li>
					<li>
						• <strong>testDayIdを実際のday_idに置き換える必要があります</strong>
					</li>
					<li>• テスト後は手動でテストデータを削除してください</li>
					<li>
						• 実際の旅行プランでテストする場合は、既存のday_idを使用してください
					</li>
				</ul>
			</div>

			<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<h3 className="font-semibold text-blue-800 mb-2">📝 実際の使用方法:</h3>
				<ol className="text-sm text-blue-700 space-y-1">
					<li>1. 実際の旅行プランを作成または開く</li>
					<li>2. スケジュール画面で「間に Venue を入れるボタン」をクリック</li>
					<li>3. 場所を検索して選択</li>
					<li>4. 挿入されたスケジュールが正しい位置に表示されることを確認</li>
				</ol>
			</div>
		</div>
	);
}
