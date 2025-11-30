"use client";

import React from "react";
import { StaticPageLayout } from "@/components/common/static/StaticPageLayout";
import { Section } from "@/components/common/static/Section";
import { SolidCard } from "@/components/common/static/SolidCard";
import { t } from "@/lib/i18n";
import { getUserLanguage } from "@/lib/utils/language";
import { useAuth } from "@/lib/contexts/auth";

export default function PrivacyPage() {
	const { user } = useAuth();
	const language = getUserLanguage(user);
	const lastUpdatedDate = new Date("2025-11-06").toLocaleDateString(
		language === "ja" ? "ja-JP" : "en-US",
	);

	return (
		<StaticPageLayout>
			{/* Hero Section */}
			<section>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
					{/* Heading */}
					<div className="lg:col-span-9">
						<h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)] font-rajdhani">
							<span className="block">{t("privacy.title")}</span>
						</h1>
					</div>
					{/* Intro copy */}
					<div className="lg:col-span-3 flex items-end">
						<div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
							<p className="text-lg md:text-xl text-gray-800 leading-relaxed">
								{t("privacy.lastUpdated", language).replace(
									"{date}",
									lastUpdatedDate,
								)}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Preface */}
			<Section title={t("privacy.preface.title")}>
				<SolidCard className="p-6 md:p-8">
					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p>{t("privacy.preface.content")}</p>
					</div>
				</SolidCard>
			</Section>

			{/* Collection of Information */}
			<Section title={t("privacy.collection.title")}>
				<SolidCard className="p-6 md:p-8">
					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p className="text-gray-700 leading-relaxed mb-4">
							{t("privacy.collection.intro")}
						</p>
						<ul className="list-disc pl-6 space-y-2 text-gray-700">
							<li>{t("privacy.collection.googleAccount")}</li>
							<li>{t("privacy.collection.travelData")}</li>
							<li>{t("privacy.collection.location")}</li>
							<li>{t("privacy.collection.usage")}</li>
						</ul>
					</div>
				</SolidCard>
			</Section>

			{/* Purpose of Information Collection */}
			<Section title={t("privacy.purpose.title")}>
				<SolidCard className="p-6 md:p-8">
					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p className="text-gray-700 leading-relaxed mb-4">
							{t("privacy.purpose.intro")}
						</p>
						<ul className="list-disc pl-6 space-y-2 text-gray-700">
							<li>{t("privacy.purpose.service")}</li>
							<li>{t("privacy.purpose.authentication")}</li>
							<li>{t("privacy.purpose.management")}</li>
							<li>{t("privacy.purpose.improvement")}</li>
							<li>{t("privacy.purpose.support")}</li>
						</ul>
					</div>
				</SolidCard>
			</Section>

			{/* Sharing of Information */}
			<Section title={t("privacy.sharing.title")}>
				<SolidCard className="p-6 md:p-8">
					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p className="text-gray-700 leading-relaxed">
							{t("privacy.sharing.content")}
						</p>
					</div>
				</SolidCard>
			</Section>

			{/* Protection of Data */}
			<Section title={t("privacy.protection.title")}>
				<SolidCard className="p-6 md:p-8">
					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p className="text-gray-700 leading-relaxed">
							{t("privacy.protection.content")}
						</p>
					</div>
				</SolidCard>
			</Section>

			{/* Contact */}
			<Section title={t("privacy.contact.title")}>
				<SolidCard className="p-6 md:p-8">
					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p
							className="text-gray-700 leading-relaxed"
							dangerouslySetInnerHTML={{
								__html: t("privacy.contact.content").replace(
									'<a href="/contact">',
									'<a href="/contact" class="text-emerald-600 hover:text-emerald-700 underline font-medium">',
								),
							}}
						/>
					</div>
				</SolidCard>
			</Section>
		</StaticPageLayout>
	);
}
