"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import FollowUserCard from "@/components/social/FollowUserCard";
import { getZIndexClass } from "@/lib/core/z-index";
import Loading from "@/components/common/Loading";
import { t } from "@/lib/i18n";

export interface PaginatedUsers {
	count: number;
	page: number;
	limit: number;
	totalPages: number;
	users: Array<{
		id: string;
		name: string;
		slug: string;
		profile_image_url?: string;
		bio?: string;
		isFollowing: boolean;
	}>;
}

interface UserListModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	fetcher: (page: number, limit: number) => Promise<PaginatedUsers>;
	showFollowButton?: boolean;
	disabled?: boolean;
}

/**
 * UserListModal Component
 *
 * ユーザー一覧モーダル（汎用化・fetcher DI方式）
 * - フォロワー、フォロー中、ブロック済みユーザー、いいねした人など、すべてこのモーダルで対応可能
 * - fetcher DI 方式により永遠に拡張可能
 * - ページネーション対応
 */
export default function UserListModal({
	isOpen,
	onClose,
	title,
	description,
	fetcher,
	showFollowButton = true,
	disabled = false,
}: UserListModalProps) {
	const [mounted, setMounted] = useState(false);
	const [users, setUsers] = useState<PaginatedUsers["users"]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [count, setCount] = useState(0);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			const handleEscapeKey = (e: KeyboardEvent) => {
				if (e.key === "Escape") {
					onClose();
				}
			};
			window.addEventListener("keydown", handleEscapeKey);
			return () => {
				window.removeEventListener("keydown", handleEscapeKey);
			};
		}
	}, [isOpen, onClose]);

	// データ取得
	const fetchData = useCallback(
		async (pageNum: number) => {
			try {
				setLoading(true);
				setError(null);

				const data = await fetcher(pageNum, 20);

				setUsers(data.users);
				setPage(data.page);
				setTotalPages(data.totalPages);
				setCount(data.count);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to fetch user list",
				);
			} finally {
				setLoading(false);
			}
		},
		[fetcher],
	);

	// モーダルが開いたときにデータを取得
	useEffect(() => {
		if (isOpen) {
			setPage(1);
			void fetchData(1);
		}
	}, [isOpen, fetchData]);

	// ページ変更
	const handlePageChange = useCallback(
		(newPage: number) => {
			if (newPage >= 1 && newPage <= totalPages && !loading && !disabled) {
				setPage(newPage);
				void fetchData(newPage);
			}
		},
		[totalPages, loading, disabled, fetchData],
	);

	// フォロー状態変更時のコールバック
	const handleFollowToggle = useCallback(
		async (userSlug: string, nextState: boolean) => {
			// 楽観的UI更新
			setUsers((prevUsers) =>
				prevUsers.map((user) =>
					user.slug === userSlug
						? { ...user, isFollowing: nextState }
						: user,
				),
			);
		},
		[],
	);

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	if (!mounted) {
		return null;
	}

	return createPortal(
		isOpen ? (
			<div
				className={`fixed inset-0 bg-black/50 ${getZIndexClass("DIALOG_OVERLAY")} flex items-center justify-center p-4`}
				onClick={handleBackdropClick}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						onClose();
					}
				}}
				role="dialog"
				aria-modal="true"
				aria-labelledby="user-list-modal-title"
			>
				<div
					className={`bg-white ${getZIndexClass("DIALOG_POPUP")} rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden`}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					{/* ヘッダー */}
					<div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
						<div>
							<h2 id="user-list-modal-title" className="text-xl font-semibold text-gray-900">{title}</h2>
							{description && (
								<p className="text-sm text-gray-500 mt-1">{description}</p>
							)}
							{count > 0 && (
								<p className="text-sm text-gray-500 mt-1">
									{count}{" "}
									{title === t("social.followers.title")
										? t("social.followers.countLabel")
										: t("social.following.countLabel")}
								</p>
							)}
						</div>
						<button
							type="button"
							onClick={onClose}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onClose();
								}
							}}
							className="text-gray-400 hover:text-gray-600 transition-colors"
							aria-label="閉じる"
							disabled={disabled}
						>
							<Icon icon="mdi:close" className="h-6 w-6" />
						</button>
					</div>

					{/* コンテンツ */}
					<div className="flex-1 overflow-y-auto">
						{loading && page === 1 ? (
							<div className="flex items-center justify-center py-12">
								<Loading size="md" />
							</div>
						) : error ? (
							<div className="flex flex-col items-center justify-center py-12">
								<p className="text-red-600 mb-4">{error}</p>
								<button
									type="button"
									onClick={() => void fetchData(page)}
									className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
								>
									{t("social.userList.retry")}
								</button>
							</div>
						) : users.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<p className="text-gray-500">{t("social.userList.empty")}</p>
							</div>
						) : (
							<div>
								{users.map((user) => (
									<FollowUserCard
										key={user.id}
										user={user}
										onFollowToggle={showFollowButton ? handleFollowToggle : undefined}
										disabled={disabled}
									/>
								))}
							</div>
						)}
					</div>

					{/* ページネーション */}
					{totalPages > 1 && (
						<div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
							<button
								type="button"
								onClick={() => handlePageChange(page - 1)}
								disabled={page === 1 || loading || disabled}
								className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								前へ
							</button>
							<div className="text-sm text-gray-600">
								{page} / {totalPages}
							</div>
							<button
								type="button"
								onClick={() => handlePageChange(page + 1)}
								disabled={page === totalPages || loading || disabled}
								className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								次へ
							</button>
						</div>
					)}
				</div>
			</div>
		) : null,
		document.body,
	);
}
