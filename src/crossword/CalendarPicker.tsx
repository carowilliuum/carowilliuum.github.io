import { useMemo, useState, type CSSProperties } from "react";

import { formatDateKey, getTodayDateKey } from "./dateKeys";
import type { CalendarStatusMap } from "./firebaseTypes";

type CalendarPickerProps = {
	value: string | null;
	monthViewDate: Date;
	statuses: CalendarStatusMap;
	onMonthChange: (nextDate: Date) => void;
	onSelectDate: (date: string) => void;
};

function startOfCalendarMonth(viewDate: Date) {
	const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
	const dayOffset = (first.getDay() + 6) % 7;
	first.setDate(first.getDate() - dayOffset);
	return first;
}

function clampProgress(value: number) {
	return Math.max(0, Math.min(1, value));
}

export default function CalendarPicker({
	value,
	monthViewDate,
	statuses,
	onMonthChange,
	onSelectDate,
}: CalendarPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const today = new Date();
	const todayKey = getTodayDateKey();
	const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
	const viewMonthStart = new Date(
		monthViewDate.getFullYear(),
		monthViewDate.getMonth(),
		1,
	);
	const canGoNext = viewMonthStart.getTime() < currentMonthStart.getTime();
	const days = useMemo(() => {
		const start = startOfCalendarMonth(monthViewDate);
		return Array.from({ length: 42 }, (_, index) => {
			const date = new Date(start);
			date.setDate(start.getDate() + index);
			return date;
		});
	}, [monthViewDate]);

	return (
		<div className="crossword-calendar">
			<button
				type="button"
				className="crossword-calendar__trigger"
				onClick={() => setIsOpen((current) => !current)}
			>
				<span className="crossword-calendar__trigger-label">
					{value ?? "Pick a puzzle"}
				</span>
				<span className="crossword-calendar__trigger-icon" aria-hidden="true">
					▾
				</span>
			</button>
			{isOpen ? (
				<div className="crossword-calendar__panel">
					<div className="crossword-calendar__header">
						<button
							type="button"
							onClick={() =>
								onMonthChange(
									new Date(
										monthViewDate.getFullYear(),
										monthViewDate.getMonth() - 1,
										1,
									),
								)
							}
						>
							‹
						</button>
						<strong>
							{monthViewDate.toLocaleDateString("en-US", {
								month: "long",
								year: "numeric",
							})}
						</strong>
						<button
							type="button"
							disabled={!canGoNext}
							aria-label="Next month"
							onClick={() => {
								if (!canGoNext) {
									return;
								}

								onMonthChange(
									new Date(
										monthViewDate.getFullYear(),
										monthViewDate.getMonth() + 1,
										1,
									),
								);
							}}
						>
							›
						</button>
					</div>
					<div className="crossword-calendar__weekday-row">
						{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
							<span key={weekday}>{weekday}</span>
						))}
					</div>
					<div className="crossword-calendar__grid">
						{days.map((date) => {
							const dateKey = formatDateKey(date);
							const status = statuses[dateKey];
							const isCurrentMonth =
								date.getMonth() === monthViewDate.getMonth();
							const isSelected = value === dateKey;
							const isToday = dateKey === todayKey;
							const isFuture = dateKey > todayKey;
							const progress =
								status?.completionState === "complete"
									? 1
									: clampProgress(status?.completionProgress ?? 0);
							const dayStyle = status
								? ({
										"--crossword-calendar-day-progress": `${progress * 100}%`,
								  } as CSSProperties)
								: undefined;

							return (
								<button
									key={dateKey}
									type="button"
									className={[
										"crossword-calendar__day",
										isCurrentMonth
											? "crossword-calendar__day--current-month"
											: "",
										isSelected ? "crossword-calendar__day--selected" : "",
										isToday ? "crossword-calendar__day--today" : "",
										isFuture ? "crossword-calendar__day--future" : "",
										status ? "crossword-calendar__day--has-status" : "",
										status?.completionState === "complete"
											? "crossword-calendar__day--complete"
											: "",
										status?.completionState === "in_progress"
											? "crossword-calendar__day--imported"
											: "",
									]
										.filter(Boolean)
										.join(" ")}
									disabled={isFuture}
									style={dayStyle}
									onClick={() => {
										if (isFuture) {
											return;
										}

										onSelectDate(dateKey);
										setIsOpen(false);
									}}
								>
									<span>{date.getDate()}</span>
								</button>
							);
						})}
					</div>
				</div>
			) : null}
		</div>
	);
}
