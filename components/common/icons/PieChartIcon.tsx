"use client";

import React from "react";

export interface PieChartIconProps {
	className?: string;
	color?: string;
}

export const PieChartIcon: React.FC<PieChartIconProps> = ({
	className = "w-5 h-5",
	color = "currentColor",
}) => (
	<svg
		className={className}
		fill="none"
		stroke={color}
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
		/>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
		/>
	</svg>
);

export default PieChartIcon;
