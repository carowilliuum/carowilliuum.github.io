import type { NYTPuzzle } from "./nyt";

type CrosswordGridProps = {
	puzzle: NYTPuzzle["puzzle"];
	selectedCellIndex: number | null;
	highlightedCellIndexes: Set<number>;
	activeClueLabel: string;
	activeClueText: string;
	guesses: Record<number, string>;
	onSelectCell: (cellIndex: number) => void;
	onUpdateGuess: (cellIndex: number, value: string) => void;
};

export default function CrosswordGrid({
	puzzle,
	selectedCellIndex,
	highlightedCellIndexes,
	activeClueLabel,
	activeClueText,
	guesses,
	onSelectCell,
	onUpdateGuess,
}: CrosswordGridProps) {
	return (
		<section className="crossword-board-panel" aria-label="Game board with clue bar">
			<div className="crossword-clue-bar">
				<div className="crossword-clue-bar__number">{activeClueLabel}</div>
				<div className="crossword-clue-bar__text">{activeClueText}</div>
			</div>

			<div
				className="crossword-grid"
				role="grid"
				aria-label="Crossword puzzle grid"
				style={{
					gridTemplateColumns: `repeat(${puzzle.dimensions.width}, 1fr)`,
				}}
			>
				{puzzle.cells.map((cell, cellIndex) => {
					const isBlock = !cell.answer;
						const className = [
							"crossword-grid__cell",
							isBlock ? "crossword-grid__cell--block" : "",
							highlightedCellIndexes.has(cellIndex)
								? "crossword-grid__cell--highlighted"
								: "",
							selectedCellIndex === cellIndex
								? "crossword-grid__cell--selected"
								: "",
						]
							.filter(Boolean)
							.join(" ");

						if (isBlock) {
							return (
								<div
									key={cellIndex}
									className={className}
									role="gridcell"
									aria-readonly="true"
								/>
							);
						}

						return (
							<button
								key={cellIndex}
								type="button"
								className={className}
								role="gridcell"
								aria-selected={selectedCellIndex === cellIndex}
								onClick={() => onSelectCell(cellIndex)}
								onKeyDown={(event) => {
									if (event.key === "Backspace" || event.key === "Delete") {
										event.preventDefault();
										onUpdateGuess(cellIndex, "");
										return;
									}

									if (/^[a-z0-9]$/i.test(event.key)) {
										event.preventDefault();
										onUpdateGuess(cellIndex, event.key.toUpperCase());
									}
								}}
							>
								{cell.label ? (
									<span className="crossword-grid__number">{cell.label}</span>
								) : null}
								<span className="crossword-grid__letter">
									{guesses[cellIndex] ?? ""}
								</span>
							</button>
						);
					})}
			</div>
		</section>
	);
}
