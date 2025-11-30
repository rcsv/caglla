"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import { useAuth } from "@/lib/contexts/auth";
import logger from "@/lib/core/logger";

interface CommentLikeButtonProps {
	tripSlug: string;
	commentId: string;
	initialLiked: boolean;
	initialCount: number;
	onToggle?: (liked: boolean, count: number) => void;
	size?: "sm" | "md" | "lg";
	showCount?: boolean;
	disabled?: boolean;
}

/**
 * Comment Like Button Component
 *
 * コメントへのいいねボタンコンポーネント
 * - 楽観的UI更新（Optimistic Update）
 * - エラーハンドリングとロールバック
 */
export default function CommentLikeButton({
	tripSlug,
	commentId,
	initialLiked,
	initialCount,
	onToggle,
	size = "sm",
	showCount = true,
	disabled = false,
}: CommentLikeButtonProps) {
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
		if (!user || authLoading || initialized || !tripSlug || !commentId) return;

		const fetchLikeState = async () => {
			try {
				const response = await makeAuthenticatedRequest(
					`/api/trip/${tripSlug}/comments/${commentId}/likes`,
				);
				if (response.ok) {
					const data = await response.json();
					setLiked(data.liked ?? false);
					setCount(
						typeof data.likesCount === "number"
							? data.likesCount
							: Number(data.likesCount) || 0,
					);
					previousStateRef.current.liked = data.liked ?? false;
					previousStateRef.current.count =
						typeof data.likesCount === "number"
							? data.likesCount
							: Number(data.likesCount) || 0;
				}
			} catch (err) {
				logger.error("Error fetching comment like state:", err);
				// エラーが発生しても初期値を使用
			} finally {
				setInitialized(true);
			}
		};

		void fetchLikeState();
	}, [user, authLoading, tripSlug, commentId, initialized]);

	const handleToggle = useCallback(
		async (e?: React.MouseEvent) => {
			// イベントの伝播を防ぐ
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}

			if (!user || loading || disabled || !tripSlug || !commentId) return;

			const nextLiked = !liked;
			const nextCount = nextLiked ? count + 1 : Math.max(0, count - 1);

			// 楽観的UI更新
			previousStateRef.current = { liked, count };
			setLiked(nextLiked);
			setCount(nextCount);
			setLoading(true);
			setError(null);

			try {
				const response = await makeAuthenticatedRequest(
					`/api/trip/${tripSlug}/comments/${commentId}/likes`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ action: "toggle" }),
					},
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					const errorMessage =
						typeof errorData.error === "string"
							? errorData.error
							: errorData.error?.message ||
								errorData.message ||
								`Failed to ${nextLiked ? "like" : "unlike"} comment`;
					throw new Error(errorMessage);
				}

				const data = await response.json();
				const finalLiked = data.liked ?? nextLiked;
				const finalCount =
					typeof data.likesCount === "number"
						? data.likesCount
						: Number(data.likesCount) || nextCount;

				setLiked(finalLiked);
				setCount(finalCount);
				previousStateRef.current = { liked: finalLiked, count: finalCount };
				onToggle?.(finalLiked, finalCount);
			} catch (err) {
				// ロールバック
				setLiked(previousStateRef.current.liked);
				setCount(previousStateRef.current.count);
				const errorMessage =
					err instanceof Error ? err.message : "Failed to toggle like";
				setError(errorMessage);
				logger.error("Error toggling comment like:", err);
			} finally {
				setLoading(false);
			}
		},
		[user, loading, disabled, tripSlug, commentId, liked, count, onToggle],
	);

	if (!user && !authLoading) {
		return null;
	}

	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	};

	const textSizeClasses = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};

	return (
		<button
			type="button"
			onClick={handleToggle}
			disabled={loading || disabled || !user}
			className={`inline-flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${textSizeClasses[size]}`}
			title={liked ? "いいねを解除" : "いいねする"}
		>
			<Icon
				icon={liked ? "mdi:heart" : "mdi:heart-outline"}
				className={`${sizeClasses[size]} ${liked ? "text-red-500" : ""} transition-colors`}
			/>
			{showCount && <span>{count}</span>}
		</button>
	);
}
