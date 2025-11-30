"use client";

import React from "react";

export interface ClipboardIconProps extends React.SVGProps<SVGSVGElement> {
	className?: string;
	color?: string;
	strokeWidth?: number;
}

export const ClipboardIcon: React.FC<ClipboardIconProps> = ({
	className = "w-5 h-5",
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
		aria-label="Clipboard"
		className={className}
		{...rest}
	>
		<rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
		<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
	</svg>
);

export default ClipboardIcon;
