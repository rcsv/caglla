/**
 * 環境に応じたAPP_URLを自動決定する関数
 */
function getAppUrlByEnvironment() {
	const nodeEnv = process.env.NODE_ENV;
	const vercelUrl = process.env.VERCEL_URL;
	const firebaseAppHostingUrl = process.env.FIREBASE_APP_HOSTING_URL;

	// 本番環境での自動判定
	if (nodeEnv === "production") {
		// Firebase App Hosting
		if (firebaseAppHostingUrl) {
			return `https://${firebaseAppHostingUrl}`;
		}
		// Vercel
		if (vercelUrl) {
			return `https://${vercelUrl}`;
		}
		// デフォルトの本番URL
		return "https://caglla--caglla-fb.asia-east1.hosted.app";
	}

	// 開発環境
	if (nodeEnv === "development") {
		return "http://localhost:3000";
	}

	// その他の環境（テストなど）
	return "http://localhost:3000";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	// allowed Dev origin
	// https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
	allowedDevOrigins: ["localhost", "elodia-protomorphic-gloria.ngrok-free.dev"],

	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},

	// Firebase App Hosting用の設定
	output: "standalone",

	// Next.js 16対応: Turbopackではなくwebpackを明示的に使用
	// (webpack設定があるため、空のturbopack設定を追加して警告を回避)
	turbopack: {},

	// Webpack設定（チャンク読み込みエラー対策）
	webpack: (config, { isServer }) => {
		if (!isServer) {
			// クライアント側のチャンク読み込みエラー対策
			config.optimization = {
				...config.optimization,
				moduleIds: "deterministic",
				chunkIds: "deterministic",
			};
		}
		return config;
	},

	// 画像の外部ドメイン設定
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "logos-world.net",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "firebasestorage.googleapis.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "storage.googleapis.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "api.dicebear.com",
				pathname: "/**",
			},
		],
		// Next.js 16対応: 使用する画像品質のリスト
		qualities: [75, 90],
		// Next.js 16対応: クエリパラメータ付きローカル画像パスの許可
		localPatterns: [
			{
				pathname: "/api/places/photo",
				// search を省略すると、すべてのクエリパラメータが許可される
			},
			{
				pathname: "/api/cached-place-image/**",
				// search を省略すると、すべてのクエリパラメータが許可される
			},
		],
	},

	async redirects() {
		return [
			// Public static section under /s
			{ source: "/", destination: "/s", permanent: false },
			{ source: "/about", destination: "/s/about", permanent: false },
			{ source: "/terms", destination: "/s/terms", permanent: false },
			{ source: "/privacy", destination: "/s/privacy", permanent: false },
			{ source: "/contact", destination: "/s/contact", permanent: false },
		];
	},
};

module.exports = nextConfig;
