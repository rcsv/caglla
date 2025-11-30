"use client";

import React from "react";
import Link from "next/link";
import { StaticPageLayout } from "@/components/common/static/StaticPageLayout";
import { Section } from "@/components/common/static/Section";
import { SolidCard } from "@/components/common/static/SolidCard";

export default function AboutPage() {
	const { t } = require("@/lib/i18n");
	return (
		<StaticPageLayout>
			{/* Hero Section */}
			<section>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
					{/* Heading */}
					<div className="lg:col-span-9">
						<h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)] font-rajdhani">
							<span className="block">{t("about.hero.line1")}</span>
							<span className="block">{t("about.hero.line2")}</span>
							<span className="block">{t("about.hero.line3")}</span>
						</h1>
					</div>
					{/* Intro copy */}
					<div className="lg:col-span-3 flex items-end">
						<div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
							<p className="text-lg md:text-xl text-gray-800 leading-relaxed">
								{t("about.intro")}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Our Story */}
			<Section title={t("about.story.title")}>
				<SolidCard className="p-8 md:p-10">
					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p>{t("about.story.p1")}</p>
						<p>{t("about.story.p2")}</p>
						<p>{t("about.story.p3")}</p>
					</div>
				</SolidCard>
			</Section>

			{/* Mission & Values */}
			<Section title={t("about.mission.title")}>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Value 1 */}
					<SolidCard className="p-8">
						<div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
							<svg
								className="w-6 h-6 text-emerald-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-bold text-gray-900 mb-3">
							{t("about.mission.simplicity.title")}
						</h3>
						<p className="text-gray-600">
							{t("about.mission.simplicity.text")}
						</p>
					</SolidCard>

					{/* Value 2 */}
					<SolidCard className="p-8">
						<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
							<svg
								className="w-6 h-6 text-blue-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-bold text-gray-900 mb-3">
							{t("about.mission.collab.title")}
						</h3>
						<p className="text-gray-600">{t("about.mission.collab.text")}</p>
					</SolidCard>

					{/* Value 3 */}
					<SolidCard className="p-8">
						<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
							<svg
								className="w-6 h-6 text-purple-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-bold text-gray-900 mb-3">
							{t("about.mission.security.title")}
						</h3>
						<p className="text-gray-600">{t("about.mission.security.text")}</p>
					</SolidCard>
				</div>
			</Section>

			{/* What We're Building */}
			<Section title={t("about.building.title")}>
				<SolidCard className="p-8 md:p-12">
					<div className="space-y-6">
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
								<svg
									className="w-5 h-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{t("about.building.item1.title")}
								</h3>
								<p className="text-gray-700">
									{t("about.building.item1.text")}
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
								<svg
									className="w-5 h-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{t("about.building.item2.title")}
								</h3>
								<p className="text-gray-700">
									{t("about.building.item2.text")}
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
								<svg
									className="w-5 h-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{t("about.building.item3.title")}
								</h3>
								<p className="text-gray-700">
									{t("about.building.item3.text")}
								</p>
							</div>
						</div>
					</div>
				</SolidCard>
			</Section>

			{/* Stats */}
			<section>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
					<div className="bg-white border border-gray-200 p-8">
						<div className="text-4xl font-bold text-emerald-600 mb-2">2024</div>
						<div className="text-gray-600">{t("about.stats.year")}</div>
					</div>
					<div className="bg-white border border-gray-200 p-8">
						<div className="text-4xl font-bold text-emerald-600 mb-2">∞</div>
						<div className="text-gray-600">{t("about.stats.possibility")}</div>
					</div>
					<div className="bg-white border border-gray-200 p-8">
						<div className="text-4xl font-bold text-emerald-600 mb-2">100%</div>
						<div className="text-gray-600">{t("about.stats.passion")}</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="text-center">
				<div className="bg-emerald-600 p-12 text-white">
					<h2 className="text-3xl font-bold mb-4">{t("about.cta.title")}</h2>
					<p className="text-xl mb-8 opacity-90">{t("about.cta.subtitle")}</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href="/contact"
							className="px-8 py-3 bg-white text-emerald-600 font-semibold hover:bg-gray-100 transition-colors border border-emerald-200"
						>
							{t("about.cta.contact")}
						</Link>
						<Link
							href="/"
							className="px-8 py-3 bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
						>
							{t("about.cta.getStarted")}
						</Link>
					</div>
				</div>
			</section>
		</StaticPageLayout>
	);
}
