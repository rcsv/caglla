"use client";

import { useState } from "react";
import { IconRenderer } from "@/components/common/icons/IconRenderer";
import { t } from "@/lib/i18n";

interface VenueInsertButtonProps {
	onInsert: () => void;
	dayId: string;
}

export default function VenueInsertButton({
	onInsert,
	dayId,
}: VenueInsertButtonProps) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div className="flex justify-center py-2">
			<button
				onClick={onInsert}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
					isHovered
						? "bg-emerald-500 text-white shadow-lg scale-110"
						: "bg-emerald-500 text-white hover:bg-emerald-600"
				}`}
				title={t("schedule.addVenueBetween")}
			>
				<IconRenderer
					iconName="plus"
					className="w-5 h-5"
					color="currentColor"
				/>
			</button>
		</div>
	);
}
