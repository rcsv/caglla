"use client";

import React from "react";

export interface CloseIconProps {
	className?: string;
	color?: string;
}

export const CloseIcon: React.FC<CloseIconProps> = ({
	className = "w-6 h-6",
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
			d="M6 18L18 6M6 6l12 12"
		/>
	</svg>
);

export default CloseIcon;
