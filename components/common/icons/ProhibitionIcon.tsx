"use client";

import React from "react";

export interface ProhibitionIconProps extends React.SVGProps<SVGSVGElement> {
	className?: string;
	color?: string;
	strokeWidth?: number;
}

export const ProhibitionIcon: React.FC<ProhibitionIconProps> = ({
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
		aria-label="Prohibition"
		className={className}
		{...rest}
	>
		<circle cx="12" cy="12" r="10" />
		<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
	</svg>
);

export default ProhibitionIcon;
