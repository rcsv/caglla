// Places Cache メトリクス収集
import logger from "@/lib/core/logger";

/**
 * Places Cache メトリクスクラス
 * キャッシュヒット率、APIエラー率などを収集
 */
class PlacesCacheMetrics {
	private hits = 0;
	private misses = 0;
	private apiErrors = 0;
	private apiSuccess = 0;
	private responseTimes: number[] = [];
	private lastFlush = Date.now();
	private flushInterval = 60000; // 1分ごとにフラッシュ

	/**
	 * キャッシュヒットを記録
	 */
	recordHit() {
		this.hits++;
		this.maybeFlush();
	}

	/**
	 * キャッシュミスを記録
	 */
	recordMiss() {
		this.misses++;
		this.maybeFlush();
	}

	/**
	 * APIエラーを記録
	 */
	recordApiError() {
		this.apiErrors++;
		this.maybeFlush();
	}

	/**
	 * API成功を記録
	 */
	recordApiSuccess() {
		this.apiSuccess++;
		this.maybeFlush();
	}

	/**
	 * レスポンス時間を記録
	 * @param timeMs - レスポンス時間（ミリ秒）
	 */
	recordResponseTime(timeMs: number) {
		this.responseTimes.push(timeMs);

		// メモリ節約のため、最新1000件のみ保持
		if (this.responseTimes.length > 1000) {
			this.responseTimes = this.responseTimes.slice(-1000);
		}

		this.maybeFlush();
	}

	/**
	 * 定期的にメトリクスをログ出力
	 */
	private maybeFlush() {
		const now = Date.now();
		if (now - this.lastFlush < this.flushInterval) {
			return;
		}

		this.flush();
		this.lastFlush = now;
	}

	/**
	 * メトリクスをログ出力してリセット
	 */
	private flush() {
		const total = this.hits + this.misses;
		if (total === 0) return;

		const hitRatio = ((this.hits / total) * 100).toFixed(2);
		const apiTotal = this.apiSuccess + this.apiErrors;
		const apiErrorRate =
			apiTotal > 0 ? ((this.apiErrors / apiTotal) * 100).toFixed(2) : "0.00";

		const avgResponseTime =
			this.responseTimes.length > 0
				? (
						this.responseTimes.reduce((a, b) => a + b, 0) /
						this.responseTimes.length
					).toFixed(2)
				: "0.00";

		logger.info("📊 Places Cache Metrics", {
			cache: {
				hits: this.hits,
				misses: this.misses,
				total,
				hitRatio: `${hitRatio}%`,
			},
			api: {
				success: this.apiSuccess,
				errors: this.apiErrors,
				total: apiTotal,
				errorRate: `${apiErrorRate}%`,
			},
			performance: {
				avgResponseTime: `${avgResponseTime}ms`,
				samples: this.responseTimes.length,
			},
		});

		// アラート条件チェック
		this.checkAlerts(
			parseFloat(hitRatio),
			parseFloat(apiErrorRate),
			parseFloat(avgResponseTime),
		);
	}

	/**
	 * アラート条件をチェック
	 */
	private checkAlerts(
		hitRatio: number,
		apiErrorRate: number,
		avgResponseTime: number,
	) {
		// キャッシュヒット率が30%以下
		if (this.hits + this.misses >= 100 && hitRatio < 30) {
			logger.warn("⚠️  ALERT: Low cache hit ratio", {
				hitRatio: `${hitRatio}%`,
			});
		}

		// APIエラー率が5%以上
		if (this.apiSuccess + this.apiErrors >= 20 && apiErrorRate > 5) {
			logger.error("🚨 ALERT: High API error rate", {
				apiErrorRate: `${apiErrorRate}%`,
			});
		}

		// 平均レスポンス時間が1秒以上
		if (this.responseTimes.length >= 10 && avgResponseTime > 1000) {
			logger.warn("⚠️  ALERT: Slow response time", {
				avgResponseTime: `${avgResponseTime}ms`,
			});
		}
	}

	/**
	 * 現在のメトリクスを取得（読み取り専用）
	 */
	getMetrics() {
		const total = this.hits + this.misses;
		const hitRatio = total > 0 ? (this.hits / total) * 100 : 0;

		const apiTotal = this.apiSuccess + this.apiErrors;
		const apiErrorRate = apiTotal > 0 ? (this.apiErrors / apiTotal) * 100 : 0;

		const avgResponseTime =
			this.responseTimes.length > 0
				? this.responseTimes.reduce((a, b) => a + b, 0) /
					this.responseTimes.length
				: 0;

		return {
			cache: {
				hits: this.hits,
				misses: this.misses,
				total,
				hitRatio,
			},
			api: {
				success: this.apiSuccess,
				errors: this.apiErrors,
				total: apiTotal,
				errorRate: apiErrorRate,
			},
			performance: {
				avgResponseTime,
				samples: this.responseTimes.length,
			},
		};
	}

	/**
	 * メトリクスをリセット
	 */
	reset() {
		this.hits = 0;
		this.misses = 0;
		this.apiErrors = 0;
		this.apiSuccess = 0;
		this.responseTimes = [];
		this.lastFlush = Date.now();
	}

	/**
	 * 手動でフラッシュ
	 */
	forceFlush() {
		this.flush();
	}
}

// シングルトンインスタンス
export const metrics = new PlacesCacheMetrics();
