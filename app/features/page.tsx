"use client";

import React from "react";
import { StaticPageLayout } from "@/components/common/static/StaticPageLayout";
import { Section } from "@/components/common/static/Section";
import { SolidCard } from "@/components/common/static/SolidCard";

export default function FeaturesPage() {
	const { t } = require("@/lib/i18n");
	return (
		<StaticPageLayout>
			<section>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
					{/* Heading */}
					<div className="lg:col-span-9">
						<h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)] font-rajdhani">
							<span className="block">{t("features")}</span>
						</h1>
					</div>
					{/* Intro */}
					<div className="lg:col-span-3 flex items-end">
						<div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
							<p className="text-lg md:text-xl text-gray-800 leading-relaxed">
								{t("features.intro")}
							</p>
						</div>
					</div>
				</div>
			</section>

			<Section title={t("features.section1.title")}>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<SolidCard className="p-8">
						<h3 className="text-lg font-semibold text-gray-900 mb-3">
							{t("features.s1.map.title")}
						</h3>
						<ul className="list-disc pl-6 space-y-2 text-gray-700">
							<li>{t("features.s1.map.li1")}</li>
							<li>{t("features.s1.map.li2")}</li>
							<li>{t("features.s1.map.li3")}</li>
						</ul>
					</SolidCard>
					<SolidCard className="p-8">
						<h3 className="text-lg font-semibold text-gray-900 mb-3">
							{t("features.s1.checklist.title")}
						</h3>
						<ul className="list-disc pl-6 space-y-2 text-gray-700">
							<li>{t("features.s1.checklist.li1")}</li>
							<li>{t("features.s1.checklist.li2")}</li>
						</ul>
					</SolidCard>
				</div>
			</Section>

			<Section title={t("features.section2.title")}>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<SolidCard className="p-8">
						<h3 className="text-lg font-semibold text-gray-900 mb-3">
							{t("features.s2.share.title")}
						</h3>
						<ul className="list-disc pl-6 space-y-2 text-gray-700">
							<li>{t("features.s2.share.li1")}</li>
							<li>{t("features.s2.share.li2")}</li>
						</ul>
					</SolidCard>
					<SolidCard className="p-8">
						<h3 className="text-lg font-semibold text-gray-900 mb-3">
							{t("features.s2.pdf.title")}
						</h3>
						<ul className="list-disc pl-6 space-y-2 text-gray-700">
							<li>{t("features.s2.pdf.li1")}</li>
							<li>{t("features.s2.pdf.li2")}</li>
						</ul>
					</SolidCard>
				</div>
			</Section>

			<Section title={t("features.section3.title")}>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<SolidCard className="p-8">
						<h3 className="text-lg font-semibold text-gray-900 mb-3">
							{t("features.s3.cost.title")}
						</h3>
						<ul className="list-disc pl-6 space-y-2 text-gray-700">
							<li>{t("features.s3.cost.li1")}</li>
							<li>{t("features.s3.cost.li2")}</li>
						</ul>
					</SolidCard>
					<SolidCard className="p-8">
						<h3 className="text-lg font-semibold text-gray-900 mb-3">
							{t("features.s3.optimize.title")}
						</h3>
						<ul className="list-disc pl-6 space-y-2 text-gray-700">
							<li>{t("features.s3.optimize.li1")}</li>
							<li>{t("features.s3.optimize.li2")}</li>
						</ul>
					</SolidCard>
				</div>
			</Section>
		</StaticPageLayout>
	);
}
