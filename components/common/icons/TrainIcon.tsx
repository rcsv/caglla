"use client";

import React from "react";

export interface TrainIconProps extends React.SVGProps<SVGSVGElement> {
	className?: string;
	color?: string;
	strokeWidth?: number;
}

export const TrainIcon: React.FC<TrainIconProps> = ({
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
		aria-label="Train"
		className={className}
		{...rest}
	>
		<rect x="4" y="3" width="16" height="12" rx="2" />
		<path d="M4 15h16" />
		<path d="M8 19h8" />
		<circle cx="8" cy="19" r="2" />
		<circle cx="16" cy="19" r="2" />
	</svg>
);

export default TrainIcon;
