"use client";

import React from "react";

export interface SelectOption {
	label: string;
	value: string;
}

export interface SelectProps
	extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	hint?: string;
	error?: string;
	options?: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
	label,
	hint,
	error,
	className,
	children,
	options,
	...rest
}) => {
	return (
		<label className="block w-full">
			{label && (
				<span className="mb-1 block text-sm font-medium text-gray-700">
					{label}
				</span>
			)}
			<select
				className={[
					"tj-select",
					error ? "border-rose-400 focus:ring-rose-400" : "",
					className,
				]
					.filter(Boolean)
					.join(" ")}
				{...rest}
			>
				{options
					? options.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))
					: children}
			</select>
			{error ? (
				<span className="mt-1 block text-xs text-rose-600">{error}</span>
			) : hint ? (
				<span className="mt-1 block text-xs text-gray-500">{hint}</span>
			) : null}
		</label>
	);
};

export default Select;
