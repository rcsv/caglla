"use client";

import React from "react";

export interface CollapseIconProps {
	className?: string;
	color?: string;
}

export const CollapseIcon: React.FC<CollapseIconProps> = ({
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
		{/* 4方向から中心へ向かう矢印 */}
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="
        M9 9V4.5 M9 9H4.5 M9 9L3.5 3.5        
        M15 9V4.5 M15 9H19.5 M15 9L20.5 3.5   
        M9 15V19.5 M9 15H4.5 M9 15L3.5 20.5   
        M15 15V19.5 M15 15H19.5 M15 15L20.5 20.5
      "
		/>
	</svg>
);

export default CollapseIcon;
