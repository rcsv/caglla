"use client";

import React from "react";

export interface MenuIconProps {
	className?: string;
	color?: string;
}

export const MenuIcon: React.FC<MenuIconProps> = ({
	className = "w-4 h-4",
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
			d="M4 6h16M4 12h16M4 18h16"
		/>
	</svg>
);

export default MenuIcon;
