"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import { useAuth } from "@/lib/contexts/auth";
import type { TripComment } from "@/lib/core/types/social";
import logger from "@/lib/core/logger";
import { Icon } from "@iconify/react";

interface CommentInputProps {
	tripSlug: string;
	parentCommentId?: string;
	onCommentAdded?: (comment: TripComment) => void;
	onCancel?: () => void;
	placeholder?: string;
}

/**
 * Comment Input Component
 *
 * Phase 2-3: Social Components実装（v3.0.0）
 *
 * コメント入力コンポーネント
 * - バリデーション
 * - 送信時のローディング状態
 * - エラーハンドリング
 */
export default function CommentInput({
	tripSlug,
	parentCommentId,
	onCommentAdded,
	onCancel,
	placeholder = "Write a comment...",
}: CommentInputProps) {
	const { user } = useAuth();
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!user) {
			setError("Please sign in to comment");
			return;
		}

		const trimmedContent = content.trim();
		if (!trimmedContent) {
			setError("Comment cannot be empty");
			return;
		}

		if (trimmedContent.length > 1000) {
			setError("Comment must be less than 1000 characters");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await makeAuthenticatedRequest(
				`/api/trip/${tripSlug}/comments`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						content: trimmedContent,
						parentCommentId: parentCommentId || undefined,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to post comment");
			}

			const newComment: TripComment = await response.json();
			setContent("");
			onCommentAdded?.(newComment);
		} catch (err) {
			logger.error("Error posting comment:", err);
			setError(err instanceof Error ? err.message : "Failed to post comment");
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setContent("");
		setError(null);
		onCancel?.();
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-2">
			<Textarea
				ref={textareaRef}
				value={content}
				onChange={(e) => {
					setContent(e.target.value);
					setError(null);
				}}
				placeholder={placeholder}
				error={error || undefined}
				rows={3}
				className="resize-none"
				disabled={loading}
				maxLength={1000}
			/>
			<div className="flex items-center justify-between">
				<span className="text-xs text-gray-500">
					{content.length}/1000 characters
				</span>
				<div className="flex items-center gap-2">
					{onCancel && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleCancel}
							disabled={loading}
						>
							Cancel
						</Button>
					)}
					<Button
						type="submit"
						variant="primary"
						size="sm"
						disabled={loading || !content.trim()}
						leftIcon={<Icon icon="mdi:send" className="h-4 w-4" />}
					>
						{loading ? "Posting..." : "Post"}
					</Button>
				</div>
			</div>
		</form>
	);
}
