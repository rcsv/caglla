"use client";

import React from "react";

export interface HotelIconProps extends React.SVGProps<SVGSVGElement> {
	className?: string;
	color?: string;
	strokeWidth?: number;
}

export const HotelIcon: React.FC<HotelIconProps> = ({
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
		aria-label="Hotel"
		className={className}
		{...rest}
	>
		<path d="M3 21h18" />
		<path d="M5 21V7l8-4v18" />
		<path d="M19 21V11l-6-4" />
		<path d="M9 9v.01" />
		<path d="M9 12v.01" />
		<path d="M9 15v.01" />
		<path d="M9 18v.01" />
	</svg>
);

export default HotelIcon;
