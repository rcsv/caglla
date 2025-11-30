"use client";

import React from "react";

export interface ToggleProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
	label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
	label,
	className,
	...rest
}) => {
	return (
		<label className="inline-flex items-center gap-2">
			<span className="tj-toggle">
				<input type="checkbox" {...rest} />
				<span className="slider"></span>
			</span>
			{label && <span className="text-sm text-gray-700">{label}</span>}
		</label>
	);
};

export default Toggle;
