import { ReactNode } from "react";

/**
 * Discover Layout
 *
 * Phase 2-4: Route Groups導入（v3.0.0）
 *
 * 発見・探索ページ用のレイアウト
 * - フィードページ
 * - 探索ページ（将来的）
 * - テンプレート一覧（将来的）
 */
export default function DiscoverLayout({ children }: { children: ReactNode }) {
	return <div className="min-h-screen bg-gray-50">{children}</div>;
}
