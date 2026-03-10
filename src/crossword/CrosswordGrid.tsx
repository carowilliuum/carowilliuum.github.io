import { useEffect, useRef } from "react";

import type { NYTPuzzle } from "./nyt";

type CrosswordGridProps = {
	puzzle: NYTPuzzle["puzzle"];
	selectedCellIndex: number | null;
	primaryHighlightedCellIndexes: Set<number>;
	secondaryHighlightedCellIndexes: Set<number>;
	activeClueLabel: string;
	activeClueText: string;
	guesses: Record<number, string>;
	onSelectCell: (cellIndex: number) => void;
	onUpdateGuess: (cellIndex: number, value: string) => void;
	onDeleteGuess: (cellIndex: number) => void;
	onMoveSelection: (cellIndex: number, key: string) => void;
};

export default function CrosswordGrid({
	puzzle,
	selectedCellIndex,
	primaryHighlightedCellIndexes,
	secondaryHighlightedCellIndexes,
	activeClueLabel,
	activeClueText,
	guesses,
	onSelectCell,
	onUpdateGuess,
	onDeleteGuess,
	onMoveSelection,
}: CrosswordGridProps) {
	const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);

	useEffect(() => {
		if (selectedCellIndex === null) {
			return;
		}

		cellRefs.current[selectedCellIndex]?.focus();
	}, [selectedCellIndex]);

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
						secondaryHighlightedCellIndexes.has(cellIndex)
							? "crossword-grid__cell--secondary-highlighted"
							: "",
						primaryHighlightedCellIndexes.has(cellIndex)
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
							ref={(element) => {
								cellRefs.current[cellIndex] = element;
							}}
							type="button"
							className={className}
							role="gridcell"
							aria-selected={selectedCellIndex === cellIndex}
							tabIndex={selectedCellIndex === cellIndex ? 0 : -1}
							onClick={() => onSelectCell(cellIndex)}
							onKeyDown={(event) => {
								if (event.key === "Backspace" || event.key === "Delete") {
									event.preventDefault();
									onDeleteGuess(cellIndex);
									return;
								}

								if (
									event.key === "ArrowUp" ||
									event.key === "ArrowDown" ||
									event.key === "ArrowLeft" ||
									event.key === "ArrowRight"
								) {
									event.preventDefault();
									onMoveSelection(cellIndex, event.key);
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
