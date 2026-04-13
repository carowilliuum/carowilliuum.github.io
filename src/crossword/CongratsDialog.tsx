type ContributionBar = {
	uid: string;
	label: string;
	color: string;
	count: number;
	share: number;
};

type CongratsDialogProps = {
	isOpen: boolean;
	variant: "complete" | "incorrect" | "unverified";
	incorrectCount?: number;
	contributors?: ContributionBar[];
	showContributionChart?: boolean;
	primaryActionLabel?: string;
	onDismiss: () => void;
	onPrimaryAction?: () => void;
	onToggleContributionChart?: () => void;
};

export default function CongratsDialog({
	isOpen,
	variant,
	incorrectCount = 0,
	contributors = [],
	showContributionChart = false,
	primaryActionLabel,
	onDismiss,
	onPrimaryAction,
	onToggleContributionChart,
}: CongratsDialogProps) {
	if (!isOpen) {
		return null;
	}

	const isComplete = variant === "complete";
	const isUnverified = variant === "unverified";

	return (
		<div className="crossword-dialog-backdrop">
			<div className="crossword-dialog crossword-dialog--celebration">
				<p className="crossword-dialog__eyebrow">
					{isComplete
						? "Puzzle complete"
						: isUnverified
							? "Verification unavailable"
							: "Almost there"}
				</p>
				<div className="crossword-dialog__header">
					<h2>
						{isComplete
							? "Everything clicks into place."
							: isUnverified
								? "Filled, but not yet verified."
								: "A few squares are still off."}
					</h2>
					<button
						type="button"
						className="crossword-dialog__close"
						aria-label="Close dialog"
						onClick={onDismiss}
					>
						×
					</button>
				</div>
				<p className="crossword-dialog__body">
					{isComplete
						? "The puzzle is fully correct. The calendar circle is filled, and your group can admire the finish."
						: isUnverified
							? "The grid is full, but the app could not retrieve reliable check results yet, so it cannot confirm whether the puzzle is correct."
							: `The grid is full, but ${incorrectCount} ${
								incorrectCount === 1 ? "square is" : "squares are"
						  } incorrect.`}
				</p>

				<div className="crossword-dialog__actions">
					{isComplete ? (
						<button
							type="button"
							className="crossword-dialog__button crossword-dialog__button--accent"
							onClick={onToggleContributionChart}
						>
							{showContributionChart
								? "Hide contribution chart"
								: "Show contribution chart"}
							</button>
					) : primaryActionLabel && onPrimaryAction ? (
						<button
							type="button"
							className="crossword-dialog__button crossword-dialog__button--accent"
							onClick={onPrimaryAction}
						>
							{primaryActionLabel}
						</button>
					) : null}
					<button
						type="button"
						className="crossword-dialog__button crossword-dialog__button--ghost"
						onClick={onDismiss}
					>
						Close
					</button>
				</div>

				{isComplete && showContributionChart ? (
					<div className="crossword-dialog__chart">
						{contributors.map((entry) => (
							<div key={entry.uid} className="crossword-dialog__chart-row">
								<div className="crossword-dialog__chart-meta">
									<span>{entry.label}</span>
									<span>{entry.count}</span>
								</div>
								<div className="crossword-dialog__chart-track">
									<div
										className="crossword-dialog__chart-fill"
										style={{
											width: `${Math.max(entry.share, 6)}%`,
											background: entry.color,
										}}
									/>
								</div>
							</div>
						))}
					</div>
				) : null}

			</div>
		</div>
	);
}
