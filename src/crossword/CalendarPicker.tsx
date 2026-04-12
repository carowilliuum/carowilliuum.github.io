import { useMemo, useState } from "react";

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

function formatDateKey(date: Date) {
	return date.toISOString().slice(0, 10);
}

export default function CalendarPicker({
	value,
	monthViewDate,
	statuses,
	onMonthChange,
	onSelectDate,
}: CalendarPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
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
							onClick={() =>
								onMonthChange(
									new Date(
										monthViewDate.getFullYear(),
										monthViewDate.getMonth() + 1,
										1,
									),
								)
							}
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
										status?.completionState === "complete"
											? "crossword-calendar__day--complete"
											: "",
										status?.completionState === "in_progress"
											? "crossword-calendar__day--imported"
											: "",
									]
										.filter(Boolean)
										.join(" ")}
									onClick={() => {
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
