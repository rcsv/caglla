export type BlogPost = {
	slug: string;
	title: string;
	excerpt: string;
	date: string;
	author: string;
	tags: string[];
	content: string;
};

export function getAllBlogPosts(): BlogPost[] {
	// NOTE: 必要に応じてMDX/CMSへ差し替え可能な単純データソース
	return [
		{
			slug: "caglla-v1-10-0-release",
			title: "v1.10.0 アップデート — グローバル対応と費用管理を強化",
			excerpt:
				"通貨推測ロジック刷新やコスト内訳ビュー、i18n対応の拡大など、v1.10.0で追加された機能をまとめました。",
			date: "2025-11-08",
			author: "Team Caglla",
			tags: ["Release", "Product"],
			content: `Caglla v1.10.0 では、旅行データを国や都市をまたいで扱いやすくするための大規模な改善を実施しました。141カ国・90通貨へ拡張されたロケーションデータと階層的なフォールバックにより、複数都市の旅でも正確な通貨表示が可能になります。

また、TripCostDisplay や TripSummaryView では費用の内訳をカテゴリ別・日別で確認できるようになり、旅の支出を俯瞰しながら調整できます。合わせて、プライバシーポリシーやアクティビティカテゴリなど主要画面の多言語対応も進み、海外ユーザーにも使いやすい体験を提供します。

詳しい変更点はリリースノート v1.10.0 をご覧ください。`,
		},
		{
			slug: "welcome-to-caglla",
			title: "Cagllaへようこそ — 旅行計画をシンプルに",
			excerpt:
				"Cagllaの目指す体験、開発の背景、今後のロードマップをご紹介します。",
			date: "2025-10-21",
			author: "Team Caglla",
			tags: ["Product", "Roadmap"],
			content:
				"Caglla は、旅行計画を美しく、簡単に管理できるプラットフォームです。複雑な旅程管理を誰でも使える直感的なツールに変え、旅行の楽しさを最大化します。",
		},
		{
			slug: "support-and-faq-refresh",
			title: "Support/FAQ/Docsを刷新しました",
			excerpt:
				"検索・カテゴリ・自己解決を重視したヘルプセンターを導入しました。",
			date: "2025-10-30",
			author: "Team Caglla",
			tags: ["Updates", "Support"],
			content:
				"サポートセンター・FAQ・ドキュメントを「検索/カテゴリ/自己解決」方針で再構築しました。より短い導線で答えにたどり着けます。",
		},
	];
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
	return getAllBlogPosts().find((p) => p.slug === slug);
}
