"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import { useAuth } from "@/lib/contexts/auth";
import logger from "@/lib/core/logger";

interface LikeButtonProps {
	tripSlug: string;
	initialLiked: boolean;
	initialCount: number;
	onToggle?: (liked: boolean, count: number) => void;
	size?: "sm" | "md" | "lg";
	showCount?: boolean;
	disabled?: boolean;
}

/**
 * Like Button Component
 *
 * Phase 2-3: Social Components実装（v3.0.0）
 *
 * いいねボタンコンポーネント
 * - 楽観的UI更新（Optimistic Update）
 * - エラーハンドリングとロールバック
 * - アニメーション（任意）
 */
export default function LikeButton({
	tripSlug,
	initialLiked,
	initialCount,
	onToggle,
	size = "md",
	showCount = true,
	disabled = false,
}: LikeButtonProps) {
	const { user, loading: authLoading } = useAuth();
	const [liked, setLiked] = useState(initialLiked);
	const [count, setCount] = useState(
		typeof initialCount === "number" ? initialCount : Number(initialCount) || 0,
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);

	// 楽観的UI更新のための前の状態を保存
	const previousStateRef = useRef<{ liked: boolean; count: number }>({
		liked: initialLiked,
		count:
			typeof initialCount === "number"
				? initialCount
				: Number(initialCount) || 0,
	});

	// 初期状態を取得（認証済みユーザーのみ）
	useEffect(() => {
		if (!user || authLoading || initialized || !tripSlug) return;

		const fetchLikeState = async () => {
			try {
				const response = await makeAuthenticatedRequest(
					`/api/trip/${tripSlug}/likes`,
				);
				if (response.ok) {
					const data = await response.json();
					setLiked(data.likedByMe ?? false);
					setCount(
						typeof data.likesCount === "number"
							? data.likesCount
							: Number(data.likesCount) || 0,
					);
					previousStateRef.current.liked = data.likedByMe ?? false;
					previousStateRef.current.count =
						typeof data.likesCount === "number"
							? data.likesCount
							: Number(data.likesCount) || 0;
				}
			} catch (err) {
				logger.error("Error fetching like state:", err);
				// エラーが発生しても初期値を使用
			} finally {
				setInitialized(true);
			}
		};

		void fetchLikeState();
	}, [user, authLoading, tripSlug, initialized]);

	const handleToggle = useCallback(
		async (e?: React.MouseEvent) => {
			// イベントの伝播を防ぐ
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}

			// バリデーション
			if (!tripSlug) {
				logger.warn("LikeButton: tripSlug is required");
				return;
			}

			// 認証チェック
			if (authLoading) return;
			if (!user) {
				// 未認証の場合はログインページへリダイレクト（またはモーダル表示）
				logger.debug("User not authenticated, redirecting to login");
				return;
			}

			if (loading || disabled) return;

			// 楽観的UI更新：即座にUIを更新
			const wasLiked = liked;
			const previousCount =
				typeof count === "number" ? count : Number(count) || 0;
			previousStateRef.current.liked = wasLiked;
			previousStateRef.current.count = previousCount;

			const nextLiked = !wasLiked;
			const nextCount = nextLiked
				? previousCount + 1
				: Math.max(0, previousCount - 1);

			setLiked(nextLiked);
			setCount(nextCount);
			setLoading(true);
			setError(null);

			// コールバックを即座に呼び出し（楽観的UI更新）
			onToggle?.(nextLiked, nextCount);

			try {
				// API呼び出し
				const response = await makeAuthenticatedRequest(
					`/api/trip/${tripSlug}/likes`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							action: nextLiked ? "like" : "unlike",
						}),
					},
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					// handleApiError は { error: { code, message, details? } } 形式を返す
					const errorMessage =
						typeof errorData.error === "string"
							? errorData.error
							: errorData.error?.message ||
								errorData.message ||
								`Failed to ${nextLiked ? "like" : "unlike"} trip`;
					throw new Error(errorMessage);
				}

				const data = await response.json();

				// サーバーからの実際の値を反映
				setLiked(data.likedByMe);
				setCount(
					typeof data.likesCount === "number"
						? data.likesCount
						: Number(data.likesCount) || 0,
				);
				onToggle?.(
					data.likedByMe,
					typeof data.likesCount === "number"
						? data.likesCount
						: Number(data.likesCount) || 0,
				);
			} catch (err) {
				logger.error("Error toggling like:", err);

				// ロールバック：前の状態に戻す
				setLiked(previousStateRef.current.liked);
				setCount(previousStateRef.current.count);
				onToggle?.(
					previousStateRef.current.liked,
					previousStateRef.current.count,
				);

				setError(err instanceof Error ? err.message : "Failed to toggle like");
			} finally {
				setLoading(false);
			}
		},
		[
			tripSlug,
			liked,
			count,
			loading,
			disabled,
			authLoading,
			user,
			onToggle,
			previousStateRef,
		],
	);

	// バリデーション
	if (!tripSlug) {
		return null;
	}

	// 未認証状態
	if (!user && !authLoading) {
		return (
			<button
				type="button"
				disabled={disabled}
				onClick={handleToggle}
				className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
          text-gray-600 hover:text-rose-600 hover:bg-rose-50
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm"}
        `}
				aria-label="Like this trip"
			>
				<Icon icon="mdi:heart-outline" className="h-5 w-5" />
				{showCount && count > 0 && (
					<span className="tabular-nums">
						{typeof count === "number" ? count : Number(count) || 0}
					</span>
				)}
			</button>
		);
	}

	// 認証済み状態
	const buttonClasses = `
    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    ${size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm"}
    ${
			liked
				? "text-rose-600 bg-rose-50 hover:bg-rose-100"
				: "text-gray-600 hover:text-rose-600 hover:bg-rose-50"
		}
    ${loading ? "opacity-70 cursor-wait" : ""}
    ${error ? "ring-2 ring-red-300" : ""}
  `.trim();

	return (
		<button
			type="button"
			disabled={loading || disabled}
			onClick={handleToggle}
			className={buttonClasses}
			aria-label={liked ? "Unlike this trip" : "Like this trip"}
			aria-pressed={liked}
		>
			<Icon
				icon={liked ? "mdi:heart" : "mdi:heart-outline"}
				className={`h-5 w-5 transition-transform duration-200 ${liked ? "scale-110" : ""}`}
			/>
			{showCount && count > 0 && (
				<span className="tabular-nums font-medium">
					{typeof count === "number" ? count : Number(count) || 0}
				</span>
			)}
			{error && (
				<span className="ml-2 text-xs text-red-600" role="alert">
					{error}
				</span>
			)}
		</button>
	);
}
