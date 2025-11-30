import React from "react";

type SolidCardProps = {
	children: React.ReactNode;
	className?: string;
};

export function SolidCard({ children, className = "" }: SolidCardProps) {
	return (
		<div className={`bg-white border border-gray-200 ${className}`}>
			{children}
		</div>
	);
}
