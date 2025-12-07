"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	ReactNode,
} from "react";
import type { ChecklistItem } from "@/lib/core/types";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import { useAuth } from "@/lib/contexts/auth";

interface ChecklistContextValue {
	items: ChecklistItem[];
	selectedItem: ChecklistItem | null;
	loading: boolean;
	saving: boolean;
	readOnly: boolean;
	setSelectedItem: (item: ChecklistItem | null) => void;
	toggle: (id: string) => void;
	addCustom: (title: string, category: "preparation" | "packing") => void;
	removeItem: (id: string) => void;
	regenerate: () => Promise<void>;
	updateUserMemo: (itemId: string, memo: string) => void;
	refresh: () => Promise<void>;
}

const ChecklistContext = createContext<ChecklistContextValue | undefined>(
	undefined,
);

interface ChecklistProviderProps {
	children: ReactNode;
	tripId?: string;
	readOnly?: boolean;
}

export function ChecklistProvider({
	children,
	tripId,
	readOnly = false,
}: ChecklistProviderProps) {
	const { user, loading: authLoading } = useAuth();
	const [items, setItems] = useState<ChecklistItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);

	// 取得関数
	const fetchChecklist = useCallback(async () => {
		if (!tripId) return;
		// 認証状態の読み込み中はスキップ
		if (authLoading) return;

		if (!user) {
			// In read-only mode, try public fetch; otherwise skip
			if (!readOnly) return;

			// For public/read-only access, use regular fetch without auth
			try {
				setLoading(true);
				const res = await fetch(`/api/trips/${tripId}/checklist`, {
					cache: "no-store",
				});
				if (res.ok) {
					const data = await res.json();
					const normalizedItems = (data.items || []).map(
						(item: ChecklistItem) => ({
							...item,
							links: item.links || [],
						}),
					);
					setItems(normalizedItems);
				}
			} catch (error) {
				console.debug("Checklist fetch failed (read-only mode):", error);
			} finally {
				setLoading(false);
			}
			return;
		}

		// 認証済みユーザーの場合、認証付きリクエストを使用
		try {
			setLoading(true);
			const res = await makeAuthenticatedRequest(
				`/api/trips/${tripId}/checklist`,
				{ cache: "no-store" },
			);
			if (res.ok) {
				const data = await res.json();
				// 既存データとの互換性: linksがない場合は空配列を設定
				const normalizedItems = (data.items || []).map(
					(item: ChecklistItem) => ({
						...item,
						links: item.links || [],
					}),
				);
				setItems(normalizedItems);
			} else {
				console.error("Failed to fetch checklist", await res.text());
			}
		} catch (error) {
			console.error("Failed to fetch checklist:", error);
		} finally {
			setLoading(false);
		}
	}, [tripId, user, authLoading, readOnly]);

	// 取得
	useEffect(() => {
		fetchChecklist();
	}, [fetchChecklist]);

	// リフレッシュ（外部から呼び出し可能）
	const refresh = useCallback(async () => {
		await fetchChecklist();
	}, [fetchChecklist]);

	// 保存
	const persist = async (next: ChecklistItem[]) => {
		if (!tripId) return;
		// 認証されていない場合は実行しない
		if (!user) {
			console.warn("Cannot save checklist: user not authenticated");
			return;
		}
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
		} catch (error) {
			console.error("Failed to save checklist:", error);
			// エラーが発生してもローカル状態は保持
			setItems(next);
		} finally {
			setSaving(false);
		}
	};

	// 再生成
	const regenerate = async () => {
		if (!tripId) return;
		// 認証されていない場合は実行しない
		if (!user) {
			console.warn("Cannot regenerate checklist: user not authenticated");
			return;
		}
		try {
			setSaving(true);
			const res = await makeAuthenticatedRequest(
				`/api/trips/${tripId}/checklist/generate`,
				{ method: "POST" },
			);
			if (res.ok) {
				const data = await res.json();
				// 既存データとの互換性: linksがない場合は空配列を設定
				const normalizedItems = (data.items || []).map(
					(item: ChecklistItem) => ({
						...item,
						links: item.links || [],
					}),
				);
				setItems(normalizedItems);
				// 選択中のアイテムも更新（longDescriptionが生成された場合に反映される）
				if (selectedItem) {
					const updatedItem = normalizedItems.find(
						(item) => item.id === selectedItem.id,
					);
					if (updatedItem) {
						setSelectedItem(updatedItem);
					}
				}
			} else {
				console.error("Failed to regenerate checklist", await res.text());
			}
		} catch (error) {
			console.error("Failed to regenerate checklist:", error);
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
	const addCustom = (title: string, category: "preparation" | "packing") => {
		if (readOnly) return; // 閲覧専用モードでは追加不可
		const t = title.trim();
		if (!t) return;
		const next: ChecklistItem[] = [
			...items,
			{
				id: `custom_${Date.now()}`,
				title: t,
				category,
				done: false,
				isCustom: true,
			},
		];
		setItems(next);
		persist(next);
	};

	// アイテム削除
	const removeItem = (id: string) => {
		if (readOnly) return; // 閲覧専用モードでは削除不可
		const next = items.filter((i) => i.id !== id);
		setItems(next);
		persist(next);
	};

	// ユーザーメモ更新
	const updateUserMemo = (itemId: string, memo: string) => {
		if (readOnly) return;
		const updatedItems = items.map((item) =>
			item.id === itemId ? { ...item, userMemo: memo } : item,
		);
		setItems(updatedItems);
		// 選択中のアイテムも更新
		if (selectedItem && selectedItem.id === itemId) {
			setSelectedItem({ ...selectedItem, userMemo: memo });
		}
		// デバウンスして保存
		clearTimeout((window as any).__checklistMemoTimeout);
		(window as any).__checklistMemoTimeout = setTimeout(() => {
			persist(updatedItems);
		}, 500);
	};

	const value: ChecklistContextValue = {
		items,
		selectedItem,
		loading,
		saving,
		readOnly,
		setSelectedItem,
		toggle,
		addCustom,
		removeItem,
		regenerate,
		updateUserMemo,
		refresh,
	};

	return (
		<ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
	);
}

export function useChecklist() {
	const context = useContext(ChecklistContext);
	if (context === undefined) {
		throw new Error("useChecklist must be used within a ChecklistProvider");
	}
	return context;
}

