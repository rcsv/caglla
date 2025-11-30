"use client";

import { useDroppable } from "@dnd-kit/core";

interface ItineraryDropZoneProps {
	dropZoneId: string;
	itineraryId: string;
	position: "before" | "after";
}

export default function ItineraryDropZone({
	dropZoneId,
	itineraryId,
	position,
}: ItineraryDropZoneProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: dropZoneId,
		data: {
			type: "itinerary-drop-zone",
			itineraryId,
			position,
		},
	});

	return (
		<div
			ref={setNodeRef}
			className={`h-2 bg-transparent rounded transition-colors ${
				isOver ? "bg-blue-200" : "hover:bg-blue-100"
			}`}
		/>
	);
}
