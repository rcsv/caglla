/**
 * API経由でItinerariesデータを削除するスクリプト
 */

async function flushItinerariesViaAPI() {
	try {
		logger.debug("🚀 Starting Itineraries data flush via API...");

		// まず、すべてのItinerariesを取得
		logger.debug("📋 Fetching all itineraries...");
		const response = await fetch("http://localhost:3000/api/itineraries", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch itineraries: ${response.status}`);
		}

		const itineraries = await response.json();
		logger.debug(`📊 Found ${itineraries.length} itineraries to delete`);

		if (itineraries.length === 0) {
			logger.debug("✅ No itineraries found. Nothing to delete.");
			return;
		}

		// 各Itineraryを削除
		let deletedCount = 0;
		for (const itinerary of itineraries) {
			try {
				const deleteResponse = await fetch(
					`http://localhost:3000/api/itineraries/${itinerary.id}`,
					{
						method: "DELETE",
						headers: {
							"Content-Type": "application/json",
						},
					},
				);

				if (deleteResponse.ok) {
					deletedCount++;
					logger.debug(
						`✅ Deleted itinerary ${deletedCount}/${itineraries.length}: ${itinerary.title}`,
					);
				} else {
					logger.error(
						`❌ Failed to delete itinerary ${itinerary.id}: ${deleteResponse.status}`,
					);
				}
			} catch (error) {
				logger.error(`❌ Error deleting itinerary ${itinerary.id}:`, error);
			}
		}

		logger.debug("🎉 Itineraries data flush completed!");
		logger.debug(
			`📊 Total deleted: ${deletedCount}/${itineraries.length} documents`,
		);
	} catch (error) {
		logger.error("❌ Error flushing itineraries data:", error);
		throw error;
	}
}

// スクリプト実行
flushItinerariesViaAPI()
	.then(() => {
		logger.debug("✅ Script completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		logger.error("❌ Script failed:", error);
		process.exit(1);
	});
