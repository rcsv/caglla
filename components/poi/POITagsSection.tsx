"use client";

interface POITagsSectionProps {
	types?: string[];
}

export function POITagsSection({ types }: POITagsSectionProps) {
	if (!types || types.length === 0) return null;

	const filteredTypes = types
		.filter((type) => type !== "point_of_interest")
		.slice(0, 5);

	if (filteredTypes.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-2">
			{filteredTypes.map((type, index) => (
				<span
					key={`${type}-${index}`}
					className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
				>
					{type.replace(/_/g, " ")}
				</span>
			))}
		</div>
	);
}

