"use client";

import { useEffect } from "react";
import { Button } from "@/components/common/Button";

/**
 * Error Boundary for Feed Page
 */
export default function FeedError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Feed page error:", error);
	}, [error]);

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					Something went wrong!
				</h2>
				<p className="text-gray-600 mb-6">
					{error.message || "Failed to load feed"}
				</p>
				<Button onClick={reset}>Try again</Button>
			</div>
		</div>
	);
}
