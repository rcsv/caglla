"use client";

import React from "react";

export interface AirplaneIconProps extends React.SVGProps<SVGSVGElement> {
	className?: string;
	color?: string;
	strokeWidth?: number;
}

export const AirplaneIcon: React.FC<AirplaneIconProps> = ({
	className = "w-4 h-4",
	color = "currentColor",
	strokeWidth = 2,
	...rest
}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke={color}
		strokeWidth={strokeWidth}
		strokeLinecap="round"
		strokeLinejoin="round"
		role="img"
		aria-label="Airplane"
		className={className}
		{...rest}
	>
		{/* 小サイズで識別しやすい紙飛行機スタイル */}
		<path d="M3 11.5l18-7-7 18-3.5-6.5L3 11.5z" />
		<path d="M14 5l-3.5 10" />
	</svg>
);

export default AirplaneIcon;
