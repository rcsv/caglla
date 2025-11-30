"use client";

import React from "react";

export interface BookmarkIconProps {
	className?: string;
	color?: string;
}

export const BookmarkIcon: React.FC<BookmarkIconProps> = ({
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
			d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
		/>
	</svg>
);

export default BookmarkIcon;
