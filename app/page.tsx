"use client";

import { useAuth } from "@/lib/contexts/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import Loading from "@/components/common/Loading";
import Link from "next/link";
import { StaticPageLayout } from "@/components/common/static/StaticPageLayout";
import { Section } from "@/components/common/static/Section";
import { SolidCard } from "@/components/common/static/SolidCard";

export default function HomePage() {
	const { user, loading, signInWithGoogle } = useAuth();
	const router = useRouter();
	const [showCookieDialog, setShowCookieDialog] = useState(false);
	const { t } = require("@/lib/i18n");

	useEffect(() => {
		if (user && !loading) {
			router.push("/home");
		}
		// Check if user has already accepted cookies
		const cookieConsent = localStorage.getItem("cookieConsent");
		if (!cookieConsent) {
			setShowCookieDialog(true);
		}
	}, [user, loading, router]);

	const handleAcceptCookies = () => {
		localStorage.setItem("cookieConsent", "true");
		setShowCookieDialog(false);
	};

	const handleRejectCookies = () => {
		localStorage.setItem("cookieConsent", "rejected");
		setShowCookieDialog(false);
	};

	if (loading) {
		return <Loading fullScreen size="lg" />;
	}

	return (
		<StaticPageLayout showLoginButton>
			{/* Hero Section - /terms のようなタイトル文字列の遊び + CAGLLAブランドカラー */}
			<section>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
					{/* Heading with playful typography */}
					<div className="lg:col-span-9">
						<h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)] font-rajdhani">
							<span className="block">Find Your</span>
							<span className="block">Next Hometown</span>
							<span className="block">with CAGLLA</span>
						</h1>
						{/* Subtitle - Brand statement */}
						<p className="mt-6 text-xl md:text-2xl text-brand-ink leading-relaxed max-w-2xl">
							Create Amazing Getaways — Live Like A Local
						</p>
					</div>
					{/* Intro copy box - /home のようなボックス表現 + CAGLLAカラー */}
					<div className="lg:col-span-3 flex items-end">
						<div className="relative z-10 bg-brand-sand/85 backdrop-blur-sm p-6 border border-brand-teal/20">
							<p className="text-lg md:text-xl text-brand-ink leading-relaxed">
								{t("home.intro")}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Brand Statement Section - CAGLLA Teal背景 */}
			<section className="mt-16">
				<div className="bg-[#1F7E79] p-12 text-white rounded-lg">
					<p className="text-2xl md:text-3xl font-bold text-center mb-4">
						CAGLLA helps you discover places where you can feel at home — even on the other side of the world.
					</p>
					<p className="text-lg text-white/90 text-center">
						CAGLLA は、世界のどこでも“自分の居場所”を見つけられる旅を届けます。
					</p>
				</div>
			</section>

			{/* Primary CTA Section - /home のようなSolidCardボックス + CAGLLAカラー */}
			<Section title={t("home.cta.primary.title")}>
				<SolidCard className="p-12 text-center border-[#1F7E79]/20">
					<div className="flex flex-col items-center gap-4">
						<Button
							variant="primary"
							size="lg"
							onClick={signInWithGoogle}
							className="px-8 py-4 text-lg font-semibold bg-brand-teal hover:bg-brand-tealDark text-white"
						>
							{t("home.cta.primary.button")}
						</Button>
						<Link
							href="/features"
							className="text-brand-teal underline decoration-dotted hover:text-brand-tealDark"
						>
							{t("home.cta.primary.seeFeatures")}
						</Link>
					</div>
				</SolidCard>
			</Section>

			{/* Features Section - /home のような3カラムグリッドとSolidCard + CAGLLAカラー */}
			<Section title={t("home.features.title")}>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<SolidCard className="p-8 border-[#1F7E79]/20 hover:border-[#1F7E79]/40 transition-colors">
						<div className="w-12 h-12 rounded-full bg-brand-blue/20 flex items-center justify-center mb-4">
							<svg
								className="w-6 h-6 text-brand-blue"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-bold text-brand-ink mb-3">
							{t("home.features.card1.title")}
						</h3>
						<p className="text-gray-600 leading-relaxed">
							{t("home.features.card1.text")}
						</p>
					</SolidCard>
					<SolidCard className="p-8 border-[#1F7E79]/20 hover:border-[#1F7E79]/40 transition-colors">
						<div className="w-12 h-12 rounded-full bg-brand-olive/20 flex items-center justify-center mb-4">
							<svg
								className="w-6 h-6 text-brand-olive"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-bold text-brand-ink mb-3">
							{t("home.features.card2.title")}
						</h3>
						<p className="text-gray-600 leading-relaxed">
							{t("home.features.card2.text")}
						</p>
					</SolidCard>
					<SolidCard className="p-8 border-[#1F7E79]/20 hover:border-[#1F7E79]/40 transition-colors">
						<div className="w-12 h-12 rounded-full bg-brand-clay/20 flex items-center justify-center mb-4">
							<svg
								className="w-6 h-6 text-brand-clay"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-bold text-brand-ink mb-3">
							{t("home.features.card3.title")}
						</h3>
						<p className="text-gray-600 leading-relaxed">
							{t("home.features.card3.text")}
						</p>
					</SolidCard>
				</div>
			</Section>

			{/* Call-to-Action Phrases - ブランドメッセージ */}
			<section className="text-center py-12">
				<div className="space-y-4">
					<h2 className="text-2xl md:text-3xl font-bold text-brand-ink">
						CAGLLA — Unlock your local side.
					</h2>
					<p className="text-xl text-brand-olive font-medium">
						Travel deeper.
					</p>
				</div>
			</section>

			{/* Bottom CTA Section - CAGLLA Tealカラーのボックス */}
			<section className="text-center">
				<div className="bg-[#1F7E79] p-12 text-white rounded-lg">
					<h2 className="text-3xl font-bold mb-4 text-white">
						{t("home.cta.bottom.title")}
					</h2>
					<p className="text-xl mb-8 text-white/90">
						{t("home.cta.bottom.subtitle")}
					</p>
					<Button
						variant="primary"
						size="lg"
						onClick={signInWithGoogle}
						className="px-8 py-3 font-semibold bg-white text-[#1F7E79] hover:bg-[#E8DCC2]"
					>
						Get Started
					</Button>
				</div>
			</section>

			{/* Cookie Consent Dialog - ブランドカラー統一 + 穏やかなデザイン */}
			{showCookieDialog && (
				<div className="fixed bottom-0 left-0 right-0 bg-brand-sand/95 backdrop-blur-sm border-t border-brand-teal/20 shadow-lg zidx-dialog-popup p-6 md:px-8 md:py-6">
					<div className="container mx-auto max-w-6xl">
						<div className="flex flex-col md:flex-row items-center justify-between gap-4">
							<div className="flex-1">
								<h3 className="font-semibold text-brand-ink mb-2">
									{t("home.cookie.title")}
								</h3>
								<p className="text-sm text-gray-700">
									{t("home.cookie.text")}
									<Link
										href="/privacy"
										className="text-brand-teal hover:text-brand-tealDark underline ml-1"
									>
										{t("home.cookie.more")}
									</Link>
								</p>
							</div>
							<div className="flex gap-3 flex-shrink-0">
								<button
									onClick={handleRejectCookies}
									className="px-6 py-2 border border-[#1F7E79] text-[#1F7E79] hover:bg-[#1F7E79]/10 bg-white/45 rounded-md transition-colors font-medium"
								>
									{t("home.cookie.reject")}
								</button>
								<Button
									variant="primary"
									onClick={handleAcceptCookies}
									className="px-6 py-2 bg-[#1F7E79] hover:bg-[#165955] text-white"
								>
									{t("home.cookie.accept")}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</StaticPageLayout>
	);
}
