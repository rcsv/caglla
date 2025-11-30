"use client";

import React from "react";

export interface RocketIconProps extends React.SVGProps<SVGSVGElement> {
	className?: string;
	color?: string;
	strokeWidth?: number;
}

export const RocketIcon: React.FC<RocketIconProps> = ({
	className = "w-6 h-6",
	color = "currentColor",
	strokeWidth = 1.8,
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
		aria-label="Rocket"
		className={className}
		{...rest}
	>
		<path d="M5 15l4-4 2 2 6-6 2 2-6 6 2 2-4 4-6-2 2-2z" />
		<path d="M7 17l2 2" />
	</svg>
);

export default RocketIcon;
