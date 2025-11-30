"use client";
import logger from "@/lib/core/logger";

import React, { useState, Suspense } from "react";
import {
	SubscriptionProvider,
	useSubscription,
} from "@/lib/contexts/subscription";
import { useRouter, useSearchParams } from "next/navigation";
import { paymentHelpers } from "@/lib/subscription/payment-service";
import { useUserData } from "@/lib/contexts/user-data";
import UnifiedIcon from "@/components/common/icons/UnifiedIcon";
import HomeFooter from "@/components/common/HomeFooter";
import Loading from "@/components/common/Loading";

// 動的レンダリングを強制（プリレンダリングを無効化）
export const dynamic = "force-dynamic";

function SubscriptionContentInner() {
	const { subscriptionStatus, subscribeToPlan } = useSubscription();
	const { refreshUserPlan } = useUserData();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isSubscribing, setIsSubscribing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubscribe = async (planId: string) => {
		setIsSubscribing(true);
		setErrorMessage(null);

		try {
			const success = await subscribeToPlan(planId);

			if (success) {
				// プラン情報を更新
				await refreshUserPlan();

				// 少し待ってから遷移（状態の同期を確実にするため）
				setTimeout(() => {
					// URLパラメータで遷移先を指定されている場合はそれを使用
					const returnTo = searchParams.get("returnTo");

					if (returnTo) {
						router.push(returnTo);
					} else {
						// デフォルトの遷移先
						if (planId === "season_traveler") {
							// 無料プランに戻った場合はホームページへ
							router.push("/");
						} else {
							// 有料プランにアップグレードした場合は旅行一覧ページへ
							router.push("/home");
						}
					}
				}, 500);
			} else {
				setErrorMessage(
					"サブスクリプションの処理に失敗しました。時間をおいて再度お試しください。",
				);
			}
		} catch (error) {
			logger.error("Subscription error:", error);
			setErrorMessage("サブスクリプションの処理中にエラーが発生しました。");
		} finally {
			setIsSubscribing(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 py-12">
			<div className="max-w-6xl mx-auto px-4">
				{/* 戻るリンク */}
				<div className="mb-4">
					<button
						type="button"
						onClick={() => router.back()}
						className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
					>
						<UnifiedIcon icon="mdi:arrow-left" className="w-5 h-5" />
						戻る
					</button>
				</div>
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
						<UnifiedIcon
							icon="mdi:crown-outline"
							className="w-8 h-8 text-purple-600"
						/>
						サブスクリプションプラン
					</h1>
					<p className="text-xl text-gray-600">
						あなたに最適なプランを選択してください
					</p>
				</div>

				{/* 現在のプラン表示 */}
				{errorMessage && (
					<div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
						{errorMessage}
					</div>
				)}
				{subscriptionStatus.plan && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
						<h2 className="text-lg font-semibold text-blue-900 mb-2">
							現在のプラン
						</h2>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-blue-800 font-medium">
									{subscriptionStatus.plan.name}
								</p>
								<p className="text-blue-600 text-sm">
									{paymentHelpers.formatPrice(
										subscriptionStatus.plan.price,
										subscriptionStatus.plan.currency,
									)}
								</p>
							</div>
							<div className="text-right">
								<p className="text-blue-600 text-sm">
									{subscriptionStatus.isSubscribed
										? "アクティブ"
										: "無料プラン"}
								</p>
								{subscriptionStatus.expiresAt && (
									<p className="text-blue-500 text-xs">
										有効期限:{" "}
										{subscriptionStatus.expiresAt.toLocaleDateString("ja-JP")}
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				{/* プラン比較 - 3段階 */}
				<div className="grid lg:grid-cols-3 gap-8 mb-12">
					{/* Season Traveler（無料プラン） */}
					<div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
						<div className="text-center mb-6">
							<h3 className="text-2xl font-bold text-gray-900 mb-2">
								Season Traveler
							</h3>
							<div className="text-4xl font-bold text-gray-900 mb-2">無料</div>
							<p className="text-gray-600">個人の軽旅行者向け</p>
						</div>

						<div className="mb-6">
							<h4 className="font-semibold text-gray-900 mb-3">制限事項</h4>
							<ul className="space-y-2 text-sm text-gray-600">
								<li>• 旅行データ: 3件まで</li>
								<li>• 旅行日数: 5日以内</li>
								<li>• ストレージ: 50MB</li>
								<li>• 写真: 5枚/旅行</li>
							</ul>
						</div>

						<ul className="space-y-3 mb-8">
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								基本的な旅程作成
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								チェックリスト（固定テンプレート）
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								PDF出力（透かし入り）
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								基本的な地図表示
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								場所検索・登録
							</li>
						</ul>

						<button
							onClick={() => handleSubscribe("season_traveler")}
							disabled={
								isSubscribing ||
								subscriptionStatus.plan?.id === "season_traveler"
							}
							className="w-full py-3 px-6 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isSubscribing
								? "処理中..."
								: subscriptionStatus.plan?.id === "season_traveler"
									? "現在のプラン"
									: "無料プランに戻る"}
						</button>
					</div>

					{/* Backpackerプラン */}
					<div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 relative">
						<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
							<span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
								<UnifiedIcon icon="mdi:star-outline" className="w-4 h-4" />
								おすすめ
							</span>
						</div>

						<div className="text-center mb-6">
							<h3 className="text-2xl font-bold text-gray-900 mb-2">
								Backpacker
							</h3>
							<div className="text-4xl font-bold text-blue-600 mb-2">
								¥480
								<span className="text-lg font-normal text-gray-600">/月</span>
							</div>
							<p className="text-gray-600">個人の旅行愛好家向け</p>
						</div>

						<div className="mb-6">
							<h4 className="font-semibold text-gray-900 mb-3">制限事項</h4>
							<ul className="space-y-2 text-sm text-gray-600">
								<li>• 旅行データ: 10件まで</li>
								<li>• 旅行日数: 14日以内</li>
								<li>• ストレージ: 500MB</li>
								<li>• 写真: 50枚/旅行</li>
							</ul>
						</div>

						<ul className="space-y-3 mb-8">
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								Season Travelerの全機能
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								<span className="font-semibold text-blue-600">
									ルート最適化（徒歩・車・電車）
								</span>
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								チェックリスト（カスタム作成）
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								PDF出力（透かしなし・カスタムカバー）
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								同行者共有（閲覧のみ）
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								基本的なコスト計算
							</li>
						</ul>

						<button
							onClick={() => handleSubscribe("backpacker")}
							disabled={
								isSubscribing || subscriptionStatus.plan?.id === "backpacker"
							}
							className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isSubscribing
								? "処理中..."
								: subscriptionStatus.plan?.id === "backpacker"
									? "現在のプラン"
									: "Backpackerプランにアップグレード"}
						</button>
					</div>

					{/* Globetrotterプラン */}
					<div className="bg-white rounded-lg shadow-lg p-8 border-2 border-purple-500 relative">
						<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
							<span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
								<UnifiedIcon icon="mdi:diamond-stone" className="w-4 h-4" />
								プレミアム
							</span>
						</div>

						<div className="text-center mb-6">
							<h3 className="text-2xl font-bold text-gray-900 mb-2">
								Globetrotter
							</h3>
							<div className="text-4xl font-bold text-purple-600 mb-2">
								¥980
								<span className="text-lg font-normal text-gray-600">/月</span>
							</div>
							<p className="text-gray-600">
								個人の旅行上級者・小規模グループ向け
							</p>
						</div>

						<div className="mb-6">
							<h4 className="font-semibold text-gray-900 mb-3">制限事項</h4>
							<ul className="space-y-2 text-sm text-gray-600">
								<li>• 旅行データ: 無制限</li>
								<li>• 旅行日数: 無制限</li>
								<li>• ストレージ: 5GB</li>
								<li>• 写真: 無制限</li>
							</ul>
						</div>

						<ul className="space-y-3 mb-8">
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								Backpackerの全機能
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								<span className="font-semibold text-purple-600">
									高度ルート最適化（複合交通）
								</span>
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								同行者との共同編集
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								AIによる旅程提案
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								PDF出力（高解像度・ブランド対応）
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								詳細なコスト分析
							</li>
							<li className="flex items-center">
								<span className="text-green-500 mr-3">✓</span>
								優先サポート
							</li>
						</ul>

						<button
							onClick={() => handleSubscribe("globetrotter")}
							disabled={
								isSubscribing || subscriptionStatus.plan?.id === "globetrotter"
							}
							className="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isSubscribing
								? "処理中..."
								: subscriptionStatus.plan?.id === "globetrotter"
									? "現在のプラン"
									: "Globetrotterプランにアップグレード"}
						</button>
					</div>
				</div>

				{/* 機能詳細 */}
				<div className="bg-white rounded-lg shadow-lg p-8 mb-8">
					<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
						<span className="inline-flex items-center gap-2 justify-center">
							<UnifiedIcon
								icon="mdi:target-variant"
								className="w-7 h-7 text-gray-700"
							/>
							主要機能の詳細
						</span>
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="flex items-center justify-center mb-4">
								<UnifiedIcon
									icon="mdi:map-outline"
									className="w-10 h-10 text-gray-600"
								/>
							</div>
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								ルート最適化
							</h3>
							<div className="space-y-2 text-sm text-gray-600">
								<p>
									<strong>基本:</strong> 徒歩・車・電車での最適ルート
								</p>
								<p>
									<strong>高度:</strong> 複合交通手段での最適化
								</p>
								<p>
									<strong>効果:</strong> 平均20-30%の時間短縮
								</p>
							</div>
						</div>

						<div className="text-center">
							<div className="flex items-center justify-center mb-4">
								<UnifiedIcon
									icon="mdi:file-pdf-box"
									className="w-10 h-10 text-gray-600"
								/>
							</div>
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								PDF出力
							</h3>
							<div className="space-y-2 text-sm text-gray-600">
								<p>
									<strong>基本:</strong> 透かし入り・シンプル
								</p>
								<p>
									<strong>カスタム:</strong> 透かしなし・カスタムカバー
								</p>
								<p>
									<strong>プレミアム:</strong> 高解像度・ブランド対応
								</p>
							</div>
						</div>

						<div className="text-center">
							<div className="flex items-center justify-center mb-4">
								<UnifiedIcon
									icon="mdi:account-multiple-outline"
									className="w-10 h-10 text-gray-600"
								/>
							</div>
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								共同編集
							</h3>
							<div className="space-y-2 text-sm text-gray-600">
								<p>
									<strong>Backpacker:</strong> 閲覧のみ共有
								</p>
								<p>
									<strong>Globetrotter:</strong> 共同編集可能
								</p>
								<p>
									<strong>権限管理:</strong> 編集者・閲覧者設定
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* 価格比較表 */}
				<div className="bg-white rounded-lg shadow-lg p-8 mb-8">
					<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
						<span className="inline-flex items-center gap-2 justify-center">
							<UnifiedIcon
								icon="mdi:chart-bar"
								className="w-7 h-7 text-gray-700"
							/>
							プラン比較表
						</span>
					</h2>

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="text-left py-3 px-4 font-semibold">機能</th>
									<th className="text-center py-3 px-4 font-semibold">
										Season Traveler
									</th>
									<th className="text-center py-3 px-4 font-semibold">
										Backpacker
									</th>
									<th className="text-center py-3 px-4 font-semibold">
										Globetrotter
									</th>
								</tr>
							</thead>
							<tbody className="text-gray-600">
								<tr className="border-b">
									<td className="py-3 px-4">価格</td>
									<td className="text-center py-3 px-4 font-semibold text-gray-900">
										無料
									</td>
									<td className="text-center py-3 px-4 font-semibold text-blue-600">
										¥480/月
									</td>
									<td className="text-center py-3 px-4 font-semibold text-purple-600">
										¥980/月
									</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4">旅行データ数</td>
									<td className="text-center py-3 px-4">3件まで</td>
									<td className="text-center py-3 px-4">10件まで</td>
									<td className="text-center py-3 px-4 font-semibold text-green-600">
										無制限
									</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4">旅行日数</td>
									<td className="text-center py-3 px-4">5日以内</td>
									<td className="text-center py-3 px-4">14日以内</td>
									<td className="text-center py-3 px-4 font-semibold text-green-600">
										無制限
									</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4">ストレージ</td>
									<td className="text-center py-3 px-4">50MB</td>
									<td className="text-center py-3 px-4">500MB</td>
									<td className="text-center py-3 px-4 font-semibold text-green-600">
										5GB
									</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4">ルート最適化</td>
									<td className="text-center py-3 px-4 text-red-500">❌</td>
									<td className="text-center py-3 px-4 text-green-500">
										✓ 基本
									</td>
									<td className="text-center py-3 px-4 text-green-500">
										✓ 高度
									</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4">共同編集</td>
									<td className="text-center py-3 px-4 text-red-500">❌</td>
									<td className="text-center py-3 px-4 text-yellow-500">
										閲覧のみ
									</td>
									<td className="text-center py-3 px-4 text-green-500">
										✓ 完全
									</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4">AI旅程提案</td>
									<td className="text-center py-3 px-4 text-red-500">❌</td>
									<td className="text-center py-3 px-4 text-red-500">❌</td>
									<td className="text-center py-3 px-4 text-green-500">✓</td>
								</tr>
								<tr className="border-b">
									<td className="py-3 px-4">PDF出力</td>
									<td className="text-center py-3 px-4">透かし入り</td>
									<td className="text-center py-3 px-4">透かしなし</td>
									<td className="text-center py-3 px-4 font-semibold text-green-600">
										高解像度
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* フッター */}
				<div className="mt-8">
					<HomeFooter />
				</div>
			</div>
		</div>
	);
}

function SubscriptionContent() {
	return (
		<Suspense fallback={<Loading fullScreen size="md" color="blue" />}>
			<SubscriptionContentInner />
		</Suspense>
	);
}

export default function SubscriptionPage() {
	return (
		<SubscriptionProvider>
			<SubscriptionContent />
		</SubscriptionProvider>
	);
}
