"use client";

import React from "react";

export interface WarningIconProps extends React.SVGProps<SVGSVGElement> {
	className?: string;
	color?: string;
	strokeWidth?: number;
}

export const WarningIcon: React.FC<WarningIconProps> = ({
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
		aria-label="Warning"
		className={className}
		{...rest}
	>
		<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
		<line x1="12" y1="9" x2="12" y2="13" />
		<line x1="12" y1="17" x2="12.01" y2="17" />
	</svg>
);

export default WarningIcon;
