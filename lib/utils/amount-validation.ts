/** 金額のバリデーションと整形 */
export function isValidAmount(amount: string): boolean {
	if (!amount) return true;
	const num = parseFloat(amount);
	return !isNaN(num) && num >= 0;
}

export function parseAmount(amount: string): number | undefined {
	if (!amount) return undefined;
	const num = parseFloat(amount);
	return isNaN(num) ? undefined : num;
}

export function formatAmountNumber(
	amount: number,
	decimals: number = 0,
): string {
	return amount.toLocaleString("ja-JP", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}
