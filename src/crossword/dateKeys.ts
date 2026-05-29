export function formatDateKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export function getTodayDateKey() {
	return formatDateKey(new Date());
}

export function parseDateKey(dateKey: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
	if (!match) {
		return null;
	}

	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function isFutureDateKey(dateKey: string, todayKey = getTodayDateKey()) {
	return dateKey > todayKey;
}
